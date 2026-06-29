import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  integer,
  pgEnum,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";

// ─── Enums ───────────────────────────────────────────────────────────
export const userRoleEnum = pgEnum("user_role", [
  "tecnico",
  "administrador",
  "gestor",
]);

export const patrolStatusEnum = pgEnum("patrol_status", [
  "em_andamento",
  "concluida",
  "validada",
  "em_atendimento",
]);

export const presenceTypeEnum = pgEnum("presence_type", [
  "entrada",
  "saida",
]);

// ─── Schools ─────────────────────────────────────────────────────────
export const schools = pgTable("schools", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  type: varchar("type", { length: 50 }).notNull(), // CEI, CEM, EM, ERM
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Users ───────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull(),
  schoolId: integer("school_id").references(() => schools.id),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Patrolls ────────────────────────────────────────────────────────
export const patrols = pgTable("patrulhas", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  schoolId: integer("school_id")
    .notNull()
    .references(() => schools.id),
  date: timestamp("date").defaultNow().notNull(),
  startTime: timestamp("start_time").defaultNow().notNull(),
  endTime: timestamp("end_time"),
  observations: text("observations"),
  audioTranscription: text("audio_transcription"),
  checklist: jsonb("checklist").$type<string[]>().default([]),
  otherDescription: text("other_description"),
  status: patrolStatusEnum("status").default("em_andamento").notNull(),
  validatedBy: integer("validated_by").references(() => users.id),
  validatedAt: timestamp("validated_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Presence Records ────────────────────────────────────────────────
export const presenceRecords = pgTable("presence_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  schoolId: integer("school_id")
    .notNull()
    .references(() => schools.id),
  type: presenceTypeEnum("type").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  notes: text("notes"),
});

// ─── Feedbacks ───────────────────────────────────────────────────────
export const feedbacks = pgTable("feedbacks", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id")
    .notNull()
    .references(() => schools.id),
  evaluatorName: varchar("evaluator_name", { length: 255 }).notNull(),
  evaluatorRole: varchar("evaluator_role", { length: 255 }),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  category: varchar("category", { length: 100 }), // 'elogio', 'reclamacao', 'sugestao'
  targetUserId: integer("target_user_id").references(() => users.id),
  token: varchar("token", { length: 255 }).unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Feedback Links ──────────────────────────────────────────────────
export const feedbackLinks = pgTable("feedback_links", {
  id: serial("id").primaryKey(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  schoolId: integer("school_id")
    .notNull()
    .references(() => schools.id),
  createdBy: integer("created_by")
    .notNull()
    .references(() => users.id),
  used: boolean("used").default(false).notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
