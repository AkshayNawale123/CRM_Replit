import { type Client, type InsertClient, type Service, type InsertService, clients, users, activities, services, defaultServices } from "@shared/schema";
import { randomUUID } from "crypto";
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

    // Get service name
    let serviceName = "";
    if (client.serviceId) {
      const serviceResult = await this.db
        .select({ name: services.name })
        .from(services)
        .where(eq(services.id, client.serviceId))
        .limit(1);
      serviceName = serviceResult[0]?.name || "";
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
    // Get or create user for responsible person
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

    // Get or create service
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
    // Check if client exists
    const existing = await this.db.select().from(clients).where(eq(clients.id, id));
    if (!existing[0]) return undefined;

    // Get or create user for responsible person
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

    // Get or create service
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

export class MemStorage implements IStorage {
  private clients: Map<string, Client>;
  private servicesList: Map<string, Service>;

  constructor() {
    this.clients = new Map();
    this.servicesList = new Map();
    this.seedServices();
    this.seedData();
  }

  private seedServices() {
    defaultServices.forEach((name) => {
      const id = randomUUID();
      this.servicesList.set(id, {
        id,
        name,
        isActive: "true",
        createdAt: new Date(),
      });
    });
  }

  private seedData() {
    const serviceArray = Array.from(this.servicesList.values());
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
        responsiblePersonId: null,
        service: "CRM",
        serviceId: serviceArray.find(s => s.name === "CRM")?.id || null,
        country: "United States",
        linkedin: "https://www.linkedin.com/in/johnsmith",
        notes: "Interested in enterprise package. Decision maker meeting scheduled.",
        source: "Referral",
        industry: "Technology",
        estimatedCloseDate: new Date("2025-12-01"),
        winProbability: 75,
        activityHistory: [
          { id: "1", action: "Follow-up call completed", user: "Sarah", date: "11/15/2025" },
          { id: "2", action: "Proposal sent", user: "Mike", date: "11/10/2025" },
          { id: "3", action: "Initial meeting", user: "Sarah", date: "11/5/2025" },
        ],
        pipelineStartDate: new Date("2025-11-05"),
        createdAt: new Date("2025-11-05"),
        updatedAt: new Date("2025-11-15"),
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
        responsiblePersonId: null,
        country: "Canada",
        linkedin: "",
        notes: "Looking for more flexible pricing options.",
        source: "Website",
        industry: "SaaS",
        estimatedCloseDate: null,
        winProbability: 30,
        activityHistory: [
          { id: "1", action: "Pricing discussion", user: "Tom", date: "11/16/2025" },
          { id: "2", action: "Proposal submitted", user: "Sarah", date: "11/10/2025" },
        ],
        pipelineStartDate: new Date("2025-11-08"),
        createdAt: new Date("2025-11-08"),
        updatedAt: new Date("2025-11-16"),
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
        responsiblePersonId: null,
        country: "United Kingdom",
        linkedin: "https://www.linkedin.com/in/roberttaylor",
        notes: "Contract signed. Awaiting project kick-off.",
        source: "Event",
        industry: "Consulting",
        estimatedCloseDate: new Date("2025-11-17"),
        winProbability: 100,
        activityHistory: [
          { id: "1", action: "Contract signed", user: "Mike", date: "11/17/2025" },
          { id: "2", action: "Final negotiations", user: "Sarah", date: "11/12/2025" },
        ],
        pipelineStartDate: new Date("2025-11-01"),
        createdAt: new Date("2025-11-01"),
        updatedAt: new Date("2025-11-17"),
      },
      {
        companyName: "Innovation Hub",
        contactPerson: "Lisa Anderson",
        email: "lisa@innovationhub.com",
        phone: "+1 555-456-7890",
        stage: "Lead",
        status: null,
        value: 95000,
        lastFollowUp: new Date("2025-11-14"),
        nextFollowUp: new Date("2025-11-21"),
        priority: "Low",
        responsiblePerson: "Tom Williams",
        responsiblePersonId: null,
        country: "Australia",
        linkedin: "",
        notes: "Initial contact made. Needs more information.",
        source: "Cold Outreach",
        industry: "Retail",
        estimatedCloseDate: null,
        winProbability: 20,
        activityHistory: [
          { id: "1", action: "Discovery call", user: "Tom", date: "11/14/2025" },
        ],
        pipelineStartDate: new Date("2025-11-14"),
        createdAt: new Date("2025-11-14"),
        updatedAt: new Date("2025-11-14"),
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
        responsiblePersonId: null,
        country: "Singapore",
        linkedin: "https://www.linkedin.com/in/davidwu",
        notes: "Strong interest. Reviewing technical requirements.",
        source: "Partner",
        industry: "Manufacturing",
        estimatedCloseDate: new Date("2025-12-15"),
        winProbability: 65,
        activityHistory: [
          { id: "1", action: "Technical review meeting", user: "Sarah", date: "11/18/2025" },
          { id: "2", action: "Proposal sent", user: "Mike", date: "11/15/2025" },
        ],
        pipelineStartDate: new Date("2025-11-12"),
        createdAt: new Date("2025-11-12"),
        updatedAt: new Date("2025-11-18"),
      },
      {
        companyName: "CloudFirst Technologies",
        contactPerson: "Michael Brown",
        email: "michael@cloudfirst.com",
        phone: "+1 555-234-5678",
        stage: "Lead",
        status: null,
        value: 150000,
        lastFollowUp: new Date("2025-11-13"),
        nextFollowUp: new Date("2025-11-20"),
        priority: "Medium",
        responsiblePerson: "Tom Williams",
        responsiblePersonId: null,
        country: "United States",
        linkedin: "",
        notes: "Exploring cloud migration options.",
        source: "Website",
        industry: "Technology",
        estimatedCloseDate: new Date("2025-12-20"),
        winProbability: 40,
        activityHistory: [
          { id: "1", action: "Initial call", user: "Tom", date: "11/13/2025" },
        ],
        pipelineStartDate: new Date("2025-11-13"),
        createdAt: new Date("2025-11-13"),
        updatedAt: new Date("2025-11-13"),
      },
      {
        companyName: "DataVision Analytics",
        contactPerson: "Jennifer Lee",
        email: "jennifer@datavision.com",
        phone: "+1 555-345-6789",
        stage: "Qualified",
        status: "In Negotiation",
        value: 280000,
        lastFollowUp: new Date("2025-11-19"),
        nextFollowUp: new Date("2025-11-26"),
        priority: "High",
        responsiblePerson: "Mike Davis",
        responsiblePersonId: null,
        country: "Canada",
        linkedin: "https://www.linkedin.com/in/jenniferlee",
        notes: "Interested in data analytics platform.",
        source: "Referral",
        industry: "Analytics",
        estimatedCloseDate: new Date("2025-12-10"),
        winProbability: 70,
        activityHistory: [
          { id: "1", action: "Demo scheduled", user: "Mike", date: "11/19/2025" },
          { id: "2", action: "Requirements gathering", user: "Mike", date: "11/15/2025" },
        ],
        pipelineStartDate: new Date("2025-11-10"),
        createdAt: new Date("2025-11-10"),
        updatedAt: new Date("2025-11-19"),
      },
      {
        companyName: "SecureNet Systems",
        contactPerson: "Thomas Martinez",
        email: "thomas@securenet.com",
        phone: "+1 555-456-7890",
        stage: "Proposal Sent",
        status: "In Negotiation",
        value: 390000,
        lastFollowUp: new Date("2025-11-17"),
        nextFollowUp: new Date("2025-11-24"),
        priority: "High",
        responsiblePerson: "Sarah Johnson",
        responsiblePersonId: null,
        country: "United States",
        linkedin: "https://www.linkedin.com/in/thomasmartinez",
        notes: "Security platform upgrade required.",
        source: "Event",
        industry: "Cybersecurity",
        estimatedCloseDate: new Date("2025-12-05"),
        winProbability: 80,
        activityHistory: [
          { id: "1", action: "Security audit review", user: "Sarah", date: "11/17/2025" },
          { id: "2", action: "Proposal presented", user: "Mike", date: "11/14/2025" },
        ],
        pipelineStartDate: new Date("2025-11-09"),
        createdAt: new Date("2025-11-09"),
        updatedAt: new Date("2025-11-17"),
      },
      {
        companyName: "GreenEnergy Corp",
        contactPerson: "Patricia Garcia",
        email: "patricia@greenenergy.com",
        phone: "+1 555-567-8901",
        stage: "Lead",
        status: null,
        value: 210000,
        lastFollowUp: new Date("2025-11-16"),
        nextFollowUp: new Date("2025-11-23"),
        priority: "Medium",
        responsiblePerson: "Tom Williams",
        responsiblePersonId: null,
        country: "Germany",
        linkedin: "",
        notes: "Renewable energy tracking system needed.",
        source: "Cold Outreach",
        industry: "Energy",
        estimatedCloseDate: null,
        winProbability: 35,
        activityHistory: [
          { id: "1", action: "First contact", user: "Tom", date: "11/16/2025" },
        ],
        pipelineStartDate: new Date("2025-11-16"),
        createdAt: new Date("2025-11-16"),
        updatedAt: new Date("2025-11-16"),
      },
      {
        companyName: "HealthTech Solutions",
        contactPerson: "Dr. James Wilson",
        email: "james@healthtech.com",
        phone: "+1 555-678-9012",
        stage: "Won",
        status: null,
        value: 520000,
        lastFollowUp: new Date("2025-11-18"),
        nextFollowUp: new Date("2025-11-25"),
        priority: "High",
        responsiblePerson: "Mike Davis",
        responsiblePersonId: null,
        country: "United States",
        linkedin: "https://www.linkedin.com/in/jameswilson",
        notes: "Contract finalized. Implementation starting next month.",
        source: "Referral",
        industry: "Healthcare",
        estimatedCloseDate: new Date("2025-11-18"),
        winProbability: 100,
        activityHistory: [
          { id: "1", action: "Contract signed", user: "Mike", date: "11/18/2025" },
          { id: "2", action: "Final review", user: "Sarah", date: "11/16/2025" },
        ],
        pipelineStartDate: new Date("2025-11-01"),
        createdAt: new Date("2025-11-01"),
        updatedAt: new Date("2025-11-18"),
      },
      {
        companyName: "EduPlatform Inc",
        contactPerson: "Susan Rodriguez",
        email: "susan@eduplatform.com",
        phone: "+1 555-789-0123",
        stage: "Qualified",
        status: "In Negotiation",
        value: 175000,
        lastFollowUp: new Date("2025-11-15"),
        nextFollowUp: new Date("2025-11-22"),
        priority: "Medium",
        responsiblePerson: "Sarah Johnson",
        responsiblePersonId: null,
        country: "United Kingdom",
        linkedin: "",
        notes: "Online learning platform integration.",
        source: "Website",
        industry: "Education",
        estimatedCloseDate: new Date("2025-12-15"),
        winProbability: 55,
        activityHistory: [
          { id: "1", action: "Platform demo", user: "Sarah", date: "11/15/2025" },
          { id: "2", action: "Needs assessment", user: "Tom", date: "11/12/2025" },
        ],
        pipelineStartDate: new Date("2025-11-11"),
        createdAt: new Date("2025-11-11"),
        updatedAt: new Date("2025-11-15"),
      },
      {
        companyName: "FinServe Group",
        contactPerson: "Richard Kim",
        email: "richard@finserve.com",
        phone: "+1 555-890-1234",
        stage: "Proposal Sent",
        status: "Proposal Rejected",
        value: 340000,
        lastFollowUp: new Date("2025-11-14"),
        nextFollowUp: new Date("2025-11-28"),
        priority: "Low",
        responsiblePerson: "Tom Williams",
        responsiblePersonId: null,
        country: "Singapore",
        linkedin: "https://www.linkedin.com/in/richardkim",
        notes: "Price point was too high. Revisit in Q1.",
        source: "Partner",
        industry: "Financial Services",
        estimatedCloseDate: null,
        winProbability: 15,
        activityHistory: [
          { id: "1", action: "Proposal feedback received", user: "Tom", date: "11/14/2025" },
          { id: "2", action: "Proposal sent", user: "Mike", date: "11/08/2025" },
        ],
        pipelineStartDate: new Date("2025-11-06"),
        createdAt: new Date("2025-11-06"),
        updatedAt: new Date("2025-11-14"),
      },
      {
        companyName: "RetailMax Corporation",
        contactPerson: "Amanda White",
        email: "amanda@retailmax.com",
        phone: "+1 555-901-2345",
        stage: "Lead",
        status: null,
        value: 125000,
        lastFollowUp: new Date("2025-11-12"),
        nextFollowUp: new Date("2025-11-19"),
        priority: "Low",
        responsiblePerson: "Tom Williams",
        responsiblePersonId: null,
        country: "Australia",
        linkedin: "",
        notes: "Retail inventory management system inquiry.",
        source: "Website",
        industry: "Retail",
        estimatedCloseDate: null,
        winProbability: 25,
        activityHistory: [
          { id: "1", action: "Information sent", user: "Tom", date: "11/12/2025" },
        ],
        pipelineStartDate: new Date("2025-11-12"),
        createdAt: new Date("2025-11-12"),
        updatedAt: new Date("2025-11-12"),
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

  async createClient(insertClient: InsertClient & { pipelineStartDate?: Date }): Promise<Client> {
    const id = randomUUID();
    const now = new Date();
    const serviceName = (insertClient as any).service;
    
    // Get or create service
    let serviceId: string | null = null;
    if (serviceName) {
      const existingService = Array.from(this.servicesList.values()).find(s => s.name === serviceName);
      if (existingService) {
        serviceId = existingService.id;
      } else {
        const newId = randomUUID();
        const newService: Service = { id: newId, name: serviceName, isActive: "true", createdAt: new Date() };
        this.servicesList.set(newId, newService);
        serviceId = newId;
      }
    }
    
    const client: Client = {
      ...insertClient,
      id,
      value: typeof insertClient.value === 'string' ? parseFloat(insertClient.value) : insertClient.value,
      status: insertClient.status,
      linkedin: insertClient.linkedin || "",
      notes: insertClient.notes || "",
      service: serviceName || "",
      serviceId: serviceId,
      activityHistory: insertClient.activityHistory || [],
      lastFollowUp: insertClient.lastFollowUp as Date,
      nextFollowUp: insertClient.nextFollowUp as Date,
      responsiblePersonId: null,
      source: "Other",
      industry: null,
      estimatedCloseDate: null,
      winProbability: null,
      pipelineStartDate: insertClient.pipelineStartDate || now,
      createdAt: now,
      updatedAt: now,
    };
    this.clients.set(id, client);
    return client;
  }

  async updateClient(id: string, insertClient: InsertClient): Promise<Client | undefined> {
    const existing = this.clients.get(id);
    if (!existing) {
      return undefined;
    }

    const serviceName = (insertClient as any).service;
    
    // Get or create service
    let serviceId: string | null = existing.serviceId || null;
    if (serviceName) {
      const existingService = Array.from(this.servicesList.values()).find(s => s.name === serviceName);
      if (existingService) {
        serviceId = existingService.id;
      } else {
        const newId = randomUUID();
        const newService: Service = { id: newId, name: serviceName, isActive: "true", createdAt: new Date() };
        this.servicesList.set(newId, newService);
        serviceId = newId;
      }
    }

    const updated: Client = {
      ...insertClient,
      id,
      value: typeof insertClient.value === 'string' ? parseFloat(insertClient.value) : insertClient.value,
      status: insertClient.status,
      linkedin: insertClient.linkedin || "",
      notes: insertClient.notes || "",
      service: serviceName || existing.service || "",
      serviceId: serviceId,
      activityHistory: insertClient.activityHistory || [],
      lastFollowUp: insertClient.lastFollowUp as Date,
      nextFollowUp: insertClient.nextFollowUp as Date,
      responsiblePersonId: existing.responsiblePersonId,
      source: existing.source,
      industry: existing.industry,
      estimatedCloseDate: existing.estimatedCloseDate,
      winProbability: existing.winProbability,
      pipelineStartDate: existing.pipelineStartDate,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
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

  async getAllServices(): Promise<Service[]> {
    return Array.from(this.servicesList.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async createService(insertService: InsertService): Promise<Service> {
    const id = randomUUID();
    const service: Service = {
      id,
      name: insertService.name,
      isActive: insertService.isActive || "true",
      createdAt: new Date(),
    };
    this.servicesList.set(id, service);
    return service;
  }

  async getServiceByName(name: string): Promise<Service | undefined> {
    return Array.from(this.servicesList.values()).find(s => s.name === name);
  }
}

// Using in-memory storage as per development guidelines
export const storage = new MemStorage();
