import { pgTable, text, serial, timestamp, boolean, integer, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const farmsTable = pgTable("farms", {
  id: serial("id").primaryKey(),
  owner_id: integer("owner_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  crop_type: text("crop_type").notNull(),
  size_feddan: doublePrecision("size_feddan").notNull(),
  // Location fields (flattened)
  governorate: text("governorate").notNull(),
  district: text("district"),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  // Media
  cover_image: text("cover_image"),
  images: text("images").array().notNull().default([]),
  // Investment terms (flattened)
  min_investment: doublePrecision("min_investment").notNull(),
  expected_roi: doublePrecision("expected_roi").notNull(),
  duration_months: integer("duration_months").notNull(),
  profit_split: doublePrecision("profit_split").notNull().default(50),
  // Visibility
  is_published: boolean("is_published").notNull().default(false),
  published_at: timestamp("published_at", { withTimezone: true }),
  // Status
  status: text("status").notNull().default("available"),
  // Stats
  views_count: integer("views_count").notNull().default(0),
  interest_count: integer("interest_count").notNull().default(0),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertFarmSchema = createInsertSchema(farmsTable).omit({ id: true, created_at: true, updated_at: true });
export type InsertFarm = z.infer<typeof insertFarmSchema>;
export type Farm = typeof farmsTable.$inferSelect;
