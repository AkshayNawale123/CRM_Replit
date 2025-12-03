import { type Client, type InsertClient, type Service, type InsertService, type StageHistory, type StageAnalytics, type ClientStageTimeline, clients, users, activities, services, clientStageHistory } from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-serverless";
import { eq, sql, isNull, and, desc } from "drizzle-orm";
import ws from "ws";

export interface IStorage {
  getAllClients(): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  createClient(client: InsertClient & { pipelineStartDate?: Date }): Promise<Client>;
  updateClient(id: string, client: InsertClient): Promise<Client | undefined>;
  deleteClient(id: string): Promise<boolean>;
  addActivity(clientId: string, activity: { action: string; user: string }): Promise<Client | undefined>;
  deleteActivity(clientId: string, activityId: string): Promise<Client | undefined>;
  getAllServices(): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;
  getServiceByName(name: string): Promise<Service | undefined>;
  // Stage history methods
  getClientStageHistory(clientId: string): Promise<StageHistory[]>;
  getStageAnalytics(): Promise<StageAnalytics[]>;
  getClientTimeline(clientId: string): Promise<ClientStageTimeline | undefined>;
  backfillStageHistory(): Promise<number>;
}

export class DbStorage implements IStorage {
  private db;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required. Please configure a PostgreSQL database.");
    }
    this.db = drizzle({
      connection: process.env.DATABASE_URL,
      ws: ws,
    });
  }

  private async enrichClientWithRelations(client: any): Promise<Client> {
    let responsiblePerson = "";
    if (client.responsiblePersonId) {
      const userResult = await this.db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, client.responsiblePersonId))
        .limit(1);
      responsiblePerson = userResult[0]?.name || "";
    }

    let serviceName = "";
    if (client.serviceId) {
      const serviceResult = await this.db
        .select({ name: services.name })
        .from(services)
        .where(eq(services.id, client.serviceId))
        .limit(1);
      serviceName = serviceResult[0]?.name || "";
    }

    const activitiesWithUsers = await this.db
      .select({
        id: activities.id,
        action: activities.action,
        createdAt: activities.createdAt,
        userName: users.name,
      })
      .from(activities)
      .leftJoin(users, eq(activities.userId, users.id))
      .where(eq(activities.clientId, client.id))
      .orderBy(sql`${activities.createdAt} DESC`);

    const activityHistory = activitiesWithUsers.map((act) => ({
      id: act.id,
      action: act.action,
      user: act.userName || "",
      date: new Date(act.createdAt).toISOString().split('T')[0],
    }));

    return {
      ...client,
      value: parseFloat(client.value),
      responsiblePerson,
      service: serviceName,
      activityHistory,
    };
  }

  async getAllClients(): Promise<Client[]> {
    const result = await this.db.select().from(clients);
    return Promise.all(result.map(client => this.enrichClientWithRelations(client)));
  }

  async getClient(id: string): Promise<Client | undefined> {
    const result = await this.db.select().from(clients).where(eq(clients.id, id));
    if (!result[0]) return undefined;
    return this.enrichClientWithRelations(result[0]);
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const responsiblePerson = (insertClient as any).responsiblePerson;
    const serviceName = (insertClient as any).service;
    let userId: string | undefined;
    let serviceId: string | undefined;
    
    if (responsiblePerson) {
      const existingUser = await this.db
        .select()
        .from(users)
        .where(eq(users.name, responsiblePerson));
      
      if (existingUser[0]) {
        userId = existingUser[0].id;
      } else {
        const newUser = await this.db
          .insert(users)
          .values({ name: responsiblePerson })
          .returning();
        userId = newUser[0].id;
      }
    }

    if (serviceName) {
      const existingService = await this.db
        .select()
        .from(services)
        .where(eq(services.name, serviceName));
      
      if (existingService[0]) {
        serviceId = existingService[0].id;
      } else {
        const newService = await this.db
          .insert(services)
          .values({ name: serviceName })
          .returning();
        serviceId = newService[0].id;
      }
    }

    const clientData = {
      ...insertClient,
      responsiblePersonId: userId,
      serviceId: serviceId,
    };

    const result = await this.db.insert(clients).values(clientData).returning();
    const newClient = result[0];

    // Record initial stage in history
    await this.db.insert(clientStageHistory).values({
      clientId: newClient.id,
      stage: newClient.stage,
      enteredAt: new Date(),
    });

    return this.enrichClientWithRelations(newClient);
  }

  async updateClient(id: string, insertClient: InsertClient): Promise<Client | undefined> {
    const existing = await this.db.select().from(clients).where(eq(clients.id, id));
    if (!existing[0]) return undefined;

    const responsiblePerson = (insertClient as any).responsiblePerson;
    const serviceName = (insertClient as any).service;
    let userId: string | undefined;
    let serviceId: string | undefined;
    
    if (responsiblePerson) {
      const existingUser = await this.db
        .select()
        .from(users)
        .where(eq(users.name, responsiblePerson));
      
      if (existingUser[0]) {
        userId = existingUser[0].id;
      } else {
        const newUser = await this.db
          .insert(users)
          .values({ name: responsiblePerson })
          .returning();
        userId = newUser[0].id;
      }
    }

    if (serviceName) {
      const existingService = await this.db
        .select()
        .from(services)
        .where(eq(services.name, serviceName));
      
      if (existingService[0]) {
        serviceId = existingService[0].id;
      } else {
        const newService = await this.db
          .insert(services)
          .values({ name: serviceName })
          .returning();
        serviceId = newService[0].id;
      }
    }

    const clientData = {
      ...insertClient,
      responsiblePersonId: userId,
      serviceId: serviceId,
      updatedAt: new Date(),
    };

    // Check if stage has changed
    const oldStage = existing[0].stage;
    const newStage = insertClient.stage;
    
    if (oldStage !== newStage) {
      const now = new Date();
      
      // Close the previous stage record (set exitedAt and calculate duration)
      const openStageRecord = await this.db
        .select()
        .from(clientStageHistory)
        .where(
          and(
            eq(clientStageHistory.clientId, id),
            isNull(clientStageHistory.exitedAt)
          )
        )
        .limit(1);
      
      if (openStageRecord[0]) {
        const enteredAt = new Date(openStageRecord[0].enteredAt);
        const durationSeconds = Math.floor((now.getTime() - enteredAt.getTime()) / 1000);
        
        await this.db
          .update(clientStageHistory)
          .set({
            exitedAt: now,
            durationSeconds: durationSeconds,
          })
          .where(eq(clientStageHistory.id, openStageRecord[0].id));
      }
      
      // Create a new stage record for the new stage
      await this.db.insert(clientStageHistory).values({
        clientId: id,
        stage: newStage,
        enteredAt: now,
      });
    }

    const result = await this.db
      .update(clients)
      .set(clientData)
      .where(eq(clients.id, id))
      .returning();
    
    return this.enrichClientWithRelations(result[0]);
  }

  async deleteClient(id: string): Promise<boolean> {
    const result = await this.db.delete(clients).where(eq(clients.id, id)).returning();
    return result.length > 0;
  }

  async addActivity(clientId: string, activity: { action: string; user: string }): Promise<Client | undefined> {
    const client = await this.db.select().from(clients).where(eq(clients.id, clientId));
    if (!client[0]) return undefined;

    let userId: string | undefined;
    if (activity.user) {
      const existingUser = await this.db
        .select()
        .from(users)
        .where(eq(users.name, activity.user));
      
      if (existingUser[0]) {
        userId = existingUser[0].id;
      } else {
        const newUser = await this.db
          .insert(users)
          .values({ name: activity.user })
          .returning();
        userId = newUser[0].id;
      }
    }

    await this.db
      .insert(activities)
      .values({
        clientId,
        action: activity.action,
        userId,
      });
    
    return this.getClient(clientId);
  }

  async deleteActivity(clientId: string, activityId: string): Promise<Client | undefined> {
    const client = await this.db.select().from(clients).where(eq(clients.id, clientId));
    if (!client[0]) return undefined;

    await this.db.delete(activities).where(eq(activities.id, activityId));
    
    return this.getClient(clientId);
  }

  async getAllServices(): Promise<Service[]> {
    const result = await this.db.select().from(services).orderBy(services.name);
    return result;
  }

  async createService(insertService: InsertService): Promise<Service> {
    const result = await this.db.insert(services).values(insertService).returning();
    return result[0];
  }

  async getServiceByName(name: string): Promise<Service | undefined> {
    const result = await this.db
      .select()
      .from(services)
      .where(eq(services.name, name))
      .limit(1);
    return result[0];
  }

  // Stage history methods
  async getClientStageHistory(clientId: string): Promise<StageHistory[]> {
    const result = await this.db
      .select()
      .from(clientStageHistory)
      .where(eq(clientStageHistory.clientId, clientId))
      .orderBy(desc(clientStageHistory.enteredAt));
    return result;
  }

  async getStageAnalytics(): Promise<StageAnalytics[]> {
    const result = await this.db
      .select({
        stage: clientStageHistory.stage,
        avgDuration: sql<number>`AVG(duration_seconds)`,
        totalClients: sql<number>`COUNT(DISTINCT client_id)`,
        completedClients: sql<number>`COUNT(CASE WHEN exited_at IS NOT NULL THEN 1 END)`,
      })
      .from(clientStageHistory)
      .groupBy(clientStageHistory.stage);

    return result.map(row => ({
      stage: row.stage,
      averageDurationSeconds: row.avgDuration || 0,
      averageDurationDays: row.avgDuration ? Math.round((row.avgDuration / 86400) * 100) / 100 : 0,
      totalClients: Number(row.totalClients) || 0,
      completedClients: Number(row.completedClients) || 0,
    }));
  }

  async getClientTimeline(clientId: string): Promise<ClientStageTimeline | undefined> {
    const client = await this.db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
    if (!client[0]) return undefined;

    const stages = await this.getClientStageHistory(clientId);
    
    const totalDurationSeconds = stages.reduce((acc, stage) => {
      return acc + (stage.durationSeconds || 0);
    }, 0);

    return {
      clientId: client[0].id,
      companyName: client[0].companyName,
      stages,
      totalDurationDays: Math.round((totalDurationSeconds / 86400) * 100) / 100,
      currentStage: client[0].stage,
    };
  }

  async backfillStageHistory(): Promise<number> {
    // Get all clients that don't have any stage history records
    const allClients = await this.db.select().from(clients);
    let backfilledCount = 0;

    for (const client of allClients) {
      // Check if this client already has stage history
      const existingHistory = await this.db
        .select()
        .from(clientStageHistory)
        .where(eq(clientStageHistory.clientId, client.id))
        .limit(1);

      if (existingHistory.length === 0) {
        // Create an initial stage record using createdAt as enteredAt
        await this.db.insert(clientStageHistory).values({
          clientId: client.id,
          stage: client.stage,
          enteredAt: client.createdAt,
        });
        backfilledCount++;
      }
    }

    return backfilledCount;
  }
}

// Database storage only - no in-memory fallback
// All data is persisted directly to PostgreSQL
export const storage = new DbStorage();
