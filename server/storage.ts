import { type Client, type InsertClient, clients, users, activities } from "@shared/schema";
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/neon-serverless";
import { eq, sql } from "drizzle-orm";
import ws from "ws";

export interface IStorage {
  getAllClients(): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: InsertClient): Promise<Client | undefined>;
  deleteClient(id: string): Promise<boolean>;
  addActivity(clientId: string, activity: { action: string; user: string }): Promise<Client | undefined>;
  deleteActivity(clientId: string, activityId: string): Promise<Client | undefined>;
}

export class DbStorage implements IStorage {
  private db;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required");
    }
    this.db = drizzle({
      connection: process.env.DATABASE_URL,
      ws: ws,
    });
  }

  private async enrichClientWithRelations(client: any): Promise<Client> {
    // Get responsible person name with a single query
    let responsiblePerson = "";
    if (client.responsiblePersonId) {
      const userResult = await this.db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, client.responsiblePersonId))
        .limit(1);
      responsiblePerson = userResult[0]?.name || "";
    }

    // Get activities with user names in a single JOIN query
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
    // Get or create user for responsible person
    const responsiblePerson = (insertClient as any).responsiblePerson;
    let userId: string | undefined;
    
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

    const clientData = {
      ...insertClient,
      responsiblePersonId: userId,
    };

    const result = await this.db.insert(clients).values(clientData).returning();
    return this.enrichClientWithRelations(result[0]);
  }

  async updateClient(id: string, insertClient: InsertClient): Promise<Client | undefined> {
    // Check if client exists
    const existing = await this.db.select().from(clients).where(eq(clients.id, id));
    if (!existing[0]) return undefined;

    // Get or create user for responsible person
    const responsiblePerson = (insertClient as any).responsiblePerson;
    let userId: string | undefined;
    
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

    const clientData = {
      ...insertClient,
      responsiblePersonId: userId,
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

    // Get or create user for activity
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
}

export class MemStorage implements IStorage {
  private clients: Map<string, Client>;

  constructor() {
    this.clients = new Map();
    this.seedData();
  }

  private seedData() {
    const sampleClients: Omit<Client, "id">[] = [
      {
        companyName: "Acme Corporation",
        contactPerson: "John Smith",
        email: "john@acme.com",
        phone: "+1 234-567-8900",
        stage: "Qualified",
        status: "In Negotiation",
        value: 250000,
        lastFollowUp: new Date("2025-11-15"),
        nextFollowUp: new Date("2025-11-22"),
        priority: "High",
        responsiblePerson: "Sarah Johnson",
        country: "United States",
        linkedin: "https://www.linkedin.com/in/johnsmith",
        notes: "Interested in enterprise package. Decision maker meeting scheduled.",
        activityHistory: [
          { id: "1", action: "Follow-up call completed", user: "Sarah", date: "11/15/2025" },
          { id: "2", action: "Proposal sent", user: "Mike", date: "11/10/2025" },
          { id: "3", action: "Initial meeting", user: "Sarah", date: "11/5/2025" },
        ],
        createdAt: new Date("2025-11-05"),
      },
      {
        companyName: "TechStart Inc",
        contactPerson: "Emily Chen",
        email: "emily@techstart.com",
        phone: "+1 555-123-4567",
        stage: "Proposal Sent",
        status: "Proposal Rejected",
        value: 180000,
        lastFollowUp: new Date("2025-11-16"),
        nextFollowUp: new Date("2025-11-23"),
        priority: "Medium",
        responsiblePerson: "Tom Williams",
        country: "Canada",
        linkedin: "",
        notes: "Looking for more flexible pricing options.",
        activityHistory: [
          { id: "1", action: "Pricing discussion", user: "Tom", date: "11/16/2025" },
          { id: "2", action: "Proposal submitted", user: "Sarah", date: "11/10/2025" },
        ],
        createdAt: new Date("2025-11-08"),
      },
      {
        companyName: "Global Solutions Ltd",
        contactPerson: "Robert Taylor",
        email: "robert@globalsolutions.com",
        phone: "+1 555-987-6543",
        stage: "Won",
        status: "On Hold",
        value: 420000,
        lastFollowUp: new Date("2025-11-17"),
        nextFollowUp: new Date("2025-11-24"),
        priority: "High",
        responsiblePerson: "Mike Davis",
        country: "United Kingdom",
        linkedin: "https://www.linkedin.com/in/roberttaylor",
        notes: "Contract signed. Awaiting project kick-off.",
        activityHistory: [
          { id: "1", action: "Contract signed", user: "Mike", date: "11/17/2025" },
          { id: "2", action: "Final negotiations", user: "Sarah", date: "11/12/2025" },
        ],
        createdAt: new Date("2025-11-01"),
      },
      {
        companyName: "Innovation Hub",
        contactPerson: "Lisa Anderson",
        email: "lisa@innovationhub.com",
        phone: "+1 555-456-7890",
        stage: "Lead",
        status: "",
        value: 95000,
        lastFollowUp: new Date("2025-11-14"),
        nextFollowUp: new Date("2025-11-21"),
        priority: "Low",
        responsiblePerson: "Tom Williams",
        country: "Australia",
        linkedin: "",
        notes: "Initial contact made. Needs more information.",
        activityHistory: [
          { id: "1", action: "Discovery call", user: "Tom", date: "11/14/2025" },
        ],
        createdAt: new Date("2025-11-14"),
      },
      {
        companyName: "FutureTech Systems",
        contactPerson: "David Wu",
        email: "david@futuretech.com",
        phone: "+1 555-789-0123",
        stage: "Proposal Sent",
        status: "In Negotiation",
        value: 320000,
        lastFollowUp: new Date("2025-11-18"),
        nextFollowUp: new Date("2025-11-25"),
        priority: "High",
        responsiblePerson: "Sarah Johnson",
        country: "Singapore",
        linkedin: "https://www.linkedin.com/in/davidwu",
        notes: "Strong interest. Reviewing technical requirements.",
        activityHistory: [
          { id: "1", action: "Technical review meeting", user: "Sarah", date: "11/18/2025" },
          { id: "2", action: "Proposal sent", user: "Mike", date: "11/15/2025" },
        ],
        createdAt: new Date("2025-11-12"),
      },
    ];

    sampleClients.forEach((client) => {
      const id = randomUUID();
      this.clients.set(id, { ...client, id });
    });
  }

  async getAllClients(): Promise<Client[]> {
    return Array.from(this.clients.values());
  }

  async getClient(id: string): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = randomUUID();
    const client: Client = {
      ...insertClient,
      id,
      status: insertClient.status === null ? "" : insertClient.status,
      linkedin: insertClient.linkedin || "",
      notes: insertClient.notes || "",
      activityHistory: insertClient.activityHistory || [],
      lastFollowUp: insertClient.lastFollowUp as Date,
      nextFollowUp: insertClient.nextFollowUp as Date,
      createdAt: new Date(),
    };
    this.clients.set(id, client);
    return client;
  }

  async updateClient(id: string, insertClient: InsertClient): Promise<Client | undefined> {
    const existing = this.clients.get(id);
    if (!existing) {
      return undefined;
    }

    const updated: Client = {
      ...insertClient,
      id,
      status: insertClient.status === null ? "" : insertClient.status,
      linkedin: insertClient.linkedin || "",
      notes: insertClient.notes || "",
      activityHistory: insertClient.activityHistory || [],
      lastFollowUp: insertClient.lastFollowUp as Date,
      nextFollowUp: insertClient.nextFollowUp as Date,
      createdAt: existing.createdAt,
    };
    this.clients.set(id, updated);
    return updated;
  }

  async deleteClient(id: string): Promise<boolean> {
    return this.clients.delete(id);
  }

  async addActivity(clientId: string, activity: { action: string; user: string }): Promise<Client | undefined> {
    const client = this.clients.get(clientId);
    if (!client) {
      return undefined;
    }

    const newActivity = {
      id: randomUUID(),
      action: activity.action,
      user: activity.user,
      date: new Date().toISOString().split('T')[0],
    };

    const updatedClient = {
      ...client,
      activityHistory: [newActivity, ...(client.activityHistory || [])],
    };

    this.clients.set(clientId, updatedClient);
    return updatedClient;
  }

  async deleteActivity(clientId: string, activityId: string): Promise<Client | undefined> {
    const client = this.clients.get(clientId);
    if (!client) {
      return undefined;
    }

    const updatedClient = {
      ...client,
      activityHistory: (client.activityHistory || []).filter(a => a.id !== activityId),
    };

    this.clients.set(clientId, updatedClient);
    return updatedClient;
  }
}

export const storage = process.env.DATABASE_URL ? new DbStorage() : new MemStorage();
