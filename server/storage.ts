import { type Client, type InsertClient, type Service, type InsertService, clients, users, activities, services } from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-serverless";
import { eq, sql } from "drizzle-orm";
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
    return this.enrichClientWithRelations(result[0]);
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
}

// Database storage only - no in-memory fallback
// All data is persisted directly to PostgreSQL
export const storage = new DbStorage();
