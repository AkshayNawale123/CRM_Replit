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
}

export const storage = new MemStorage();
