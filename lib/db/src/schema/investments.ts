import { pgTable, text, serial, timestamp, integer, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { farmsTable } from "./farms";

export const investmentsTable = pgTable("investments", {
  id: serial("id").primaryKey(),
  farm_id: integer("farm_id").notNull().references(() => farmsTable.id, { onDelete: "cascade" }),
  investor_id: integer("investor_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  owner_id: integer("owner_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  amount: doublePrecision("amount"),
  message: text("message"),
  status: text("status").notNull().default("pending"),
  type: text("type").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertInvestmentSchema = createInsertSchema(investmentsTable).omit({ id: true, created_at: true, updated_at: true });
export type InsertInvestment = z.infer<typeof insertInvestmentSchema>;
export type Investment = typeof investmentsTable.$inferSelect;
