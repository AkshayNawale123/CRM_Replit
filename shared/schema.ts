import { sql } from "drizzle-orm";
import { pgTable, text, varchar, numeric, timestamp, jsonb, pgEnum, uuid, index, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Services table for dynamic service management
export const services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  isActive: text("is_active").default("true"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// PostgreSQL ENUMs for better type safety
export const stageEnum = pgEnum("stage", [
  "Lead",
  "Qualified",
  "Meeting Scheduled",
  "Demo Completed",
  "Proof of Concept (POC)",
  "Proposal Sent",
  "Verbal Commitment",
  "Contract Review",
  "Won",
  "Lost"
]);
export const statusEnum = pgEnum("status", [
  "In Negotiation",
  "Proposal Rejected",
  "On Hold",
  "Pending Review",
  "Awaiting Response",
  "Under Evaluation",
  "Budget Approval Pending"
]);
export const priorityEnum = pgEnum("priority", ["High", "Medium", "Low"]);
export const sourceEnum = pgEnum("source", ["Referral", "Website", "Event", "Cold Outreach", "Partner", "Other"]);
export const roleEnum = pgEnum("role", ["Sales Rep", "Manager", "Admin"]);

// Users table for responsible persons
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  email: text("email"),
  role: roleEnum("role").default("Sales Rep"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Improved clients table with better data types and additional fields
export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: text("company_name").notNull(),
  contactPerson: text("contact_person").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  stage: stageEnum("stage").notNull(),
  status: statusEnum("status"),
  value: numeric("value", { precision: 10, scale: 2 }).notNull(),
  lastFollowUp: timestamp("last_follow_up", { withTimezone: true }).notNull(),
  nextFollowUp: timestamp("next_follow_up", { withTimezone: true }).notNull(),
  priority: priorityEnum("priority").notNull(),
  responsiblePersonId: varchar("responsible_person_id").references(() => users.id),
  serviceId: varchar("service_id").references(() => services.id),
  country: text("country").notNull(),
  linkedin: text("linkedin").default(""),
  notes: text("notes").default(""),
  source: sourceEnum("source").default("Other"),
  industry: text("industry"),
  estimatedCloseDate: timestamp("estimated_close_date", { withTimezone: true }),
  winProbability: integer("win_probability"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  stageIdx: index("clients_stage_idx").on(table.stage),
  priorityIdx: index("clients_priority_idx").on(table.priority),
  responsiblePersonIdx: index("clients_responsible_person_idx").on(table.responsiblePersonId),
  serviceIdx: index("clients_service_idx").on(table.serviceId),
}));

// Normalized activities table
export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  userId: varchar("user_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  clientIdx: index("activities_client_idx").on(table.clientId),
}));

// Relations
export const servicesRelations = relations(services, ({ many }) => ({
  clients: many(clients),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  responsiblePerson: one(users, {
    fields: [clients.responsiblePersonId],
    references: [users.id],
  }),
  service: one(services, {
    fields: [clients.serviceId],
    references: [services.id],
  }),
  activities: many(activities),
}));

export const usersRelations = relations(users, ({ many }) => ({
  clients: many(clients),
  activities: many(activities),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  client: one(clients, {
    fields: [activities.clientId],
    references: [clients.id],
  }),
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
}));

// Legacy activity schema for backward compatibility during migration
export const activitySchema = z.object({
  id: z.string(),
  action: z.string(),
  user: z.string(),
  date: z.string(),
});

export const addActivitySchema = z.object({
  action: z.string().trim().min(1, "Activity description is required"),
  user: z.string().trim().min(1, "User name is required"),
});

export type Activity = z.infer<typeof activitySchema>;
export type AddActivity = z.infer<typeof addActivitySchema>;

export const clientFormSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  contactPerson: z.string().min(1, "Contact person is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  stage: z.enum([
    "Lead",
    "Qualified",
    "Meeting Scheduled",
    "Demo Completed",
    "Proof of Concept (POC)",
    "Proposal Sent",
    "Verbal Commitment",
    "Contract Review",
    "Won",
    "Lost"
  ]),
  status: z.enum([
    "In Negotiation",
    "Proposal Rejected",
    "On Hold",
    "Pending Review",
    "Awaiting Response",
    "Under Evaluation",
    "Budget Approval Pending"
  ]).nullable(),
  value: z.number().min(0, "Value must be positive"),
  priority: z.enum(["High", "Medium", "Low"]),
  responsiblePerson: z.string().min(1, "Responsible person is required"),
  country: z.string().min(1, "Country is required"),
  service: z.string().optional().default(""),
  linkedin: z.string().optional().default(""),
  notes: z.string().default(""),
  lastFollowUp: z.string().min(1, "Last follow-up date is required"),
  nextFollowUp: z.string().min(1, "Next follow-up date is required"),
});

export type ClientFormData = z.infer<typeof clientFormSchema>;

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  responsiblePersonId: true,
  serviceId: true,
  source: true,
  industry: true,
  estimatedCloseDate: true,
  winProbability: true,
}).extend({
  value: z.number().min(0, "Value must be positive").transform(val => val.toString()),
  stage: z.enum([
    "Lead",
    "Qualified",
    "Meeting Scheduled",
    "Demo Completed",
    "Proof of Concept (POC)",
    "Proposal Sent",
    "Verbal Commitment",
    "Contract Review",
    "Won",
    "Lost"
  ]),
  status: z.enum([
    "In Negotiation",
    "Proposal Rejected",
    "On Hold",
    "Pending Review",
    "Awaiting Response",
    "Under Evaluation",
    "Budget Approval Pending"
  ]).nullable(),
  priority: z.enum(["High", "Medium", "Low"]),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  responsiblePerson: z.string().min(1, "Responsible person is required"),
  country: z.string().min(1, "Country is required"),
  service: z.string().optional().default(""),
  linkedin: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  lastFollowUp: z.string().min(1, "Last follow-up date is required").transform(val => new Date(val)),
  nextFollowUp: z.string().min(1, "Next follow-up date is required").transform(val => new Date(val)),
  activityHistory: z.array(z.any()).optional(),
});

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = Omit<typeof clients.$inferSelect, 'value'> & {
  value: number;
  responsiblePerson?: string;
  service?: string;
  activityHistory?: Activity[];
  pipelineStartDate?: Date;
};

export const stageOptions = [
  "Lead",
  "Qualified",
  "Meeting Scheduled",
  "Demo Completed",
  "Proof of Concept (POC)",
  "Proposal Sent",
  "Verbal Commitment",
  "Contract Review",
  "Won",
  "Lost"
] as const;
export const statusOptions = [
  null,
  "In Negotiation",
  "Proposal Rejected",
  "On Hold",
  "Pending Review",
  "Awaiting Response",
  "Under Evaluation",
  "Budget Approval Pending"
] as const;
export const priorityOptions = ["High", "Medium", "Low"] as const;

// Stage to Status mapping - defines which statuses are valid for each pipeline stage
export const stageStatusMapping: Record<string, (string | null)[]> = {
  "Lead": [null, "Awaiting Response"],
  "Qualified": [null, "Under Evaluation", "Pending Review"],
  "Meeting Scheduled": [null, "Awaiting Response"],
  "Demo Completed": [null, "Under Evaluation", "Awaiting Response"],
  "Proof of Concept (POC)": [null, "In Negotiation", "Under Evaluation", "Pending Review"],
  "Proposal Sent": [null, "Pending Review", "Under Evaluation", "On Hold"],
  "Verbal Commitment": [null, "Budget Approval Pending", "Pending Review"],
  "Contract Review": [null, "In Negotiation", "Pending Review", "On Hold"],
  "Won": [null],
  "Lost": [null, "Proposal Rejected", "On Hold"]
};

// Helper function to get valid statuses for a given stage
export function getStatusOptionsForStage(stage: string): (string | null)[] {
  return stageStatusMapping[stage] || [null];
}

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
});

export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;

export const defaultServices = [
  "Product Development",
  "CRM",
  "ERP",
  "Mobile Development",
  "Website Creation",
  "Digital Marketing",
  "ITSM"
] as const;
