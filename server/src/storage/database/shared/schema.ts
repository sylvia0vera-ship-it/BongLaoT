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
    // 关系阶段：普通互动/熟悉陪伴/暧昧升温/恋爱感人设/冷淡流失/风险降温
    relationship_stage: varchar("relationship_stage", { length: 20 }).default("普通互动"),
    // 消费/支持习惯
    support_habits: text("support_habits"),
    // 聊天偏好
    chat_preferences: text("chat_preferences"),
    // 雷点
    triggers: text("triggers"),
    // 常用称呼
    nickname: varchar("nickname", { length: 64 }),
    // 最近一次互动摘要
    last_interaction_summary: text("last_interaction_summary"),
    // 下一步维护建议
    next_step_suggestion: text("next_step_suggestion"),
    // 主播人设类型：温柔陪伴型/女友感型/撒娇型/成熟姐姐型/轻松朋友型
    persona_type: varchar("persona_type", { length: 20 }).default("温柔陪伴型"),
    // 兼容旧字段
    tags: text("tags"),
    notes: text("notes"),
    relationship_level: varchar("relationship_level", { length: 20 }).default("普通互动"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("fans_relationship_stage_idx").on(table.relationship_stage),
    index("fans_created_at_idx").on(table.created_at),
  ]
);

export const users = pgTable(
  "users",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    email: varchar("email", { length: 128 }).notNull().unique(),
    username: varchar("username", { length: 64 }).notNull(),
    password: varchar("password", { length: 256 }).notNull(),
    nickname: varchar("nickname", { length: 64 }),
    avatar_url: text("avatar_url"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("users_email_idx").on(table.email),
  ]
);

export const chatLogs = pgTable(
  "chat_logs",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    fan_id: varchar("fan_id", { length: 36 }).notNull().references(() => fans.id, { onDelete: "cascade" }),
    message: text("message").notNull(),
    context: text("context"),
    analysis_result: jsonb("analysis_result"),
    // 聊天模式：pre-chat/mid-chat/post-chat
    chat_mode: varchar("chat_mode", { length: 20 }).default("mid-chat"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("chat_logs_fan_id_idx").on(table.fan_id),
    index("chat_logs_created_at_idx").on(table.created_at),
  ]
);
