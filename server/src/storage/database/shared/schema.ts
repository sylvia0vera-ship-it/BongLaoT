import { pgTable, serial, varchar, timestamp, text, jsonb, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const healthCheck = pgTable("health_check", {
  id: serial().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const fans = pgTable(
  "fans",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 128 }).notNull(),
    tags: text("tags"),  // 逗号分隔的标签，如"大R,常互动,暧昧试探"
    notes: text("notes"), // 备注
    relationship_level: varchar("relationship_level", { length: 20 }).default("普通"),  // 新粉/普通/忠实/重点
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("fans_relationship_level_idx").on(table.relationship_level),
    index("fans_created_at_idx").on(table.created_at),
  ]
);

export const chatLogs = pgTable(
  "chat_logs",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    fan_id: varchar("fan_id", { length: 36 }).notNull().references(() => fans.id, { onDelete: "cascade" }),
    message: text("message").notNull(),  // 粉丝消息
    context: text("context"),  // 补充背景
    analysis_result: jsonb("analysis_result"),  // AI分析结果JSON
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("chat_logs_fan_id_idx").on(table.fan_id),
    index("chat_logs_created_at_idx").on(table.created_at),
  ]
);
