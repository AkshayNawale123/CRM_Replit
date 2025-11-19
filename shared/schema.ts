import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const activitySchema = z.object({
  id: z.string(),
  action: z.string(),
  user: z.string(),
  date: z.string(),
});

export type Activity = z.infer<typeof activitySchema>;

export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: text("company_name").notNull(),
  contactPerson: text("contact_person").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  stage: text("stage").notNull(),
  status: text("status"),
  value: integer("value").notNull(),
  lastFollowUp: timestamp("last_follow_up").notNull(),
  nextFollowUp: timestamp("next_follow_up").notNull(),
  priority: text("priority").notNull(),
  notes: text("notes").default(""),
  activityHistory: jsonb("activity_history").$type<Activity[]>().default([]),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const clientFormSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  contactPerson: z.string().min(1, "Contact person is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  stage: z.enum(["Lead", "Qualified", "Proposal Sent", "Won"]),
  status: z.enum(["In Negotiation", "Proposal Rejected", "On Hold", ""]),
  value: z.number().min(0, "Value must be positive"),
  priority: z.enum(["High", "Medium", "Low"]),
  notes: z.string().default(""),
  lastFollowUp: z.string().min(1, "Last follow-up date is required"),
  nextFollowUp: z.string().min(1, "Next follow-up date is required"),
});

export type ClientFormData = z.infer<typeof clientFormSchema>;

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
}).extend({
  value: z.number().min(0, "Value must be positive"),
  stage: z.enum(["Lead", "Qualified", "Proposal Sent", "Won"]),
  status: z.enum(["In Negotiation", "Proposal Rejected", "On Hold", ""]).transform(val => val || null).nullable(),
  priority: z.enum(["High", "Medium", "Low"]),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  notes: z.string().optional().default(""),
  activityHistory: z.array(activitySchema).optional().default([]),
  lastFollowUp: z.string().min(1, "Last follow-up date is required").transform(val => new Date(val)),
  nextFollowUp: z.string().min(1, "Next follow-up date is required").transform(val => new Date(val)),
});

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

export const stageOptions = ["Lead", "Qualified", "Proposal Sent", "Won"] as const;
export const statusOptions = ["In Negotiation", "Proposal Rejected", "On Hold", ""] as const;
export const priorityOptions = ["High", "Medium", "Low"] as const;
