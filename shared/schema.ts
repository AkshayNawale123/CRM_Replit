import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: text("company_name").notNull(),
  contactPerson: text("contact_person").notNull(),
  stage: text("stage").notNull(),
  status: text("status"),
  value: integer("value").notNull(),
  lastFollowUp: timestamp("last_follow_up").notNull(),
  nextFollowUp: timestamp("next_follow_up").notNull(),
  priority: text("priority").notNull(),
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
}).extend({
  value: z.number().min(0, "Value must be positive"),
  stage: z.enum(["Lead", "Qualified", "Proposal Sent", "Won"]),
  status: z.enum(["In Negotiation", "Proposal Rejected", "On Hold", ""]).transform(val => val || null).nullable(),
  priority: z.enum(["High", "Medium", "Low"]),
  lastFollowUp: z.string().min(1, "Last follow-up date is required").transform(val => new Date(val)),
  nextFollowUp: z.string().min(1, "Next follow-up date is required").transform(val => new Date(val)),
});

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

export const stageOptions = ["Lead", "Qualified", "Proposal Sent", "Won"] as const;
export const statusOptions = ["In Negotiation", "Proposal Rejected", "On Hold", ""] as const;
export const priorityOptions = ["High", "Medium", "Low"] as const;
