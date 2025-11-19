import { type Client, type InsertClient } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getAllClients(): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: InsertClient): Promise<Client | undefined>;
  deleteClient(id: string): Promise<boolean>;
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
        stage: "Qualified",
        status: "In Negotiation",
        value: 250000,
        lastFollowUp: new Date("2025-11-15"),
        nextFollowUp: new Date("2025-11-20"),
        priority: "High",
      },
      {
        companyName: "TechStart Inc",
        contactPerson: "Emily Chen",
        stage: "Proposal Sent",
        status: "Proposal Rejected",
        value: 180000,
        lastFollowUp: new Date("2025-11-16"),
        nextFollowUp: new Date("2025-11-22"),
        priority: "Medium",
      },
      {
        companyName: "Global Solutions Ltd",
        contactPerson: "Robert Taylor",
        stage: "Won",
        status: "On Hold",
        value: 420000,
        lastFollowUp: new Date("2025-11-17"),
        nextFollowUp: new Date("2025-11-25"),
        priority: "High",
      },
      {
        companyName: "Innovation Hub",
        contactPerson: "Lisa Anderson",
        stage: "Lead",
        status: "",
        value: 95000,
        lastFollowUp: new Date("2025-11-14"),
        nextFollowUp: new Date("2025-11-19"),
        priority: "Low",
      },
      {
        companyName: "FutureTech Systems",
        contactPerson: "David Wu",
        stage: "Proposal Sent",
        status: "In Negotiation",
        value: 320000,
        lastFollowUp: new Date("2025-11-18"),
        nextFollowUp: new Date("2025-11-21"),
        priority: "High",
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
      lastFollowUp: insertClient.lastFollowUp as Date,
      nextFollowUp: insertClient.nextFollowUp as Date,
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
      lastFollowUp: insertClient.lastFollowUp as Date,
      nextFollowUp: insertClient.nextFollowUp as Date,
    };
    this.clients.set(id, updated);
    return updated;
  }

  async deleteClient(id: string): Promise<boolean> {
    return this.clients.delete(id);
  }
}

export const storage = new MemStorage();
