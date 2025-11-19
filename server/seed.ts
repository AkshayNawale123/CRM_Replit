import { drizzle } from "drizzle-orm/neon-serverless";
import { clients } from "../shared/schema";
import ws from "ws";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const db = drizzle({
  connection: process.env.DATABASE_URL,
  ws: ws,
});

const sampleClients = [
  {
    companyName: "Acme Corporation",
    contactPerson: "John Smith",
    email: "john@acme.com",
    phone: "+1 234-567-8900",
    stage: "Qualified" as const,
    status: "In Negotiation",
    value: 250000,
    lastFollowUp: new Date("2025-11-15"),
    nextFollowUp: new Date("2025-11-22"),
    priority: "High" as const,
    responsiblePerson: "Sarah Johnson",
    country: "United States",
    linkedin: "https://www.linkedin.com/in/johnsmith",
    notes: "Interested in enterprise package. Decision maker meeting scheduled.",
    activityHistory: [
      { id: "1", action: "Follow-up call completed", user: "Sarah", date: "11/15/2025" },
      { id: "2", action: "Proposal sent", user: "Mike", date: "11/10/2025" },
      { id: "3", action: "Initial meeting", user: "Sarah", date: "11/5/2025" },
    ],
  },
  {
    companyName: "TechStart Inc",
    contactPerson: "Emily Chen",
    email: "emily@techstart.com",
    phone: "+1 555-123-4567",
    stage: "Proposal Sent" as const,
    status: "Proposal Rejected",
    value: 180000,
    lastFollowUp: new Date("2025-11-16"),
    nextFollowUp: new Date("2025-11-23"),
    priority: "Medium" as const,
    responsiblePerson: "Tom Williams",
    country: "Canada",
    linkedin: "",
    notes: "Looking for more flexible pricing options.",
    activityHistory: [
      { id: "1", action: "Pricing discussion", user: "Tom", date: "11/16/2025" },
      { id: "2", action: "Proposal submitted", user: "Sarah", date: "11/10/2025" },
    ],
  },
  {
    companyName: "Global Solutions Ltd",
    contactPerson: "Robert Taylor",
    email: "robert@globalsolutions.com",
    phone: "+1 555-987-6543",
    stage: "Won" as const,
    status: "On Hold",
    value: 420000,
    lastFollowUp: new Date("2025-11-17"),
    nextFollowUp: new Date("2025-11-24"),
    priority: "High" as const,
    responsiblePerson: "Mike Davis",
    country: "United Kingdom",
    linkedin: "https://www.linkedin.com/in/roberttaylor",
    notes: "Contract signed. Awaiting project kick-off.",
    activityHistory: [
      { id: "1", action: "Contract signed", user: "Mike", date: "11/17/2025" },
      { id: "2", action: "Final negotiations", user: "Sarah", date: "11/12/2025" },
    ],
  },
  {
    companyName: "Innovation Hub",
    contactPerson: "Lisa Anderson",
    email: "lisa@innovationhub.com",
    phone: "+1 555-456-7890",
    stage: "Lead" as const,
    status: null,
    value: 95000,
    lastFollowUp: new Date("2025-11-14"),
    nextFollowUp: new Date("2025-11-21"),
    priority: "Low" as const,
    responsiblePerson: "Tom Williams",
    country: "Australia",
    linkedin: "",
    notes: "Initial contact made. Needs more information.",
    activityHistory: [
      { id: "1", action: "Discovery call", user: "Tom", date: "11/14/2025" },
    ],
  },
  {
    companyName: "FutureTech Systems",
    contactPerson: "David Wu",
    email: "david@futuretech.com",
    phone: "+1 555-789-0123",
    stage: "Proposal Sent" as const,
    status: "In Negotiation",
    value: 320000,
    lastFollowUp: new Date("2025-11-18"),
    nextFollowUp: new Date("2025-11-25"),
    priority: "High" as const,
    responsiblePerson: "Sarah Johnson",
    country: "Singapore",
    linkedin: "https://www.linkedin.com/in/davidwu",
    notes: "Strong interest. Reviewing technical requirements.",
    activityHistory: [
      { id: "1", action: "Technical review meeting", user: "Sarah", date: "11/18/2025" },
      { id: "2", action: "Proposal sent", user: "Mike", date: "11/15/2025" },
    ],
  },
];

async function seed() {
  console.log("Starting database seed...");
  
  const result = await db.insert(clients).values(sampleClients).returning();
  
  console.log(`Seeded ${result.length} clients successfully!`);
  process.exit(0);
}

seed().catch((error) => {
  console.error("Error seeding database:", error);
  process.exit(1);
});
