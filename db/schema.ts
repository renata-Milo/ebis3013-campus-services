import type { DemoData } from "@contracts/types";
import { int, json, mysqlTable, timestamp } from "drizzle-orm/mysql-core";

export const demoState = mysqlTable("campus_demo_state", {
  id: int("id").primaryKey(),
  revision: int("revision").notNull().default(1),
  data: json("data").$type<DemoData>().notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type DemoStateRow = typeof demoState.$inferSelect;
