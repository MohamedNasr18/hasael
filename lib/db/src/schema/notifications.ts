import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { farmsTable } from "./farms";
import { investmentsTable } from "./investments";

export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  recipient_id: integer("recipient_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  investment_id: integer("investment_id").references(() => investmentsTable.id, { onDelete: "set null" }),
  farm_id: integer("farm_id").references(() => farmsTable.id, { onDelete: "set null" }),
  is_read: boolean("is_read").notNull().default(false),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notificationsTable).omit({ id: true, created_at: true });
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notificationsTable.$inferSelect;
