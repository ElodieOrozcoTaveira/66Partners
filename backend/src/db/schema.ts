import {
  pgTable, uuid, varchar, text, timestamp, integer, smallint, boolean, pgEnum, unique, primaryKey, doublePrecision,
} from "drizzle-orm/pg-core";

export const sportLevelEnum = pgEnum("sport_level", ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]);
export const participationStatusEnum = pgEnum("participation_status", ["PENDING", "ACCEPTED", "REFUSED"]);
export const activitiesStatusEnum = pgEnum("activities_status", ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]);



export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  pseudo: varchar("pseudo", { length: 100 }).notNull(),
  city: varchar("city", { length: 100 }),
  bio: text("bio"),
  dispo: text("dispo"),
  avatar: varchar("avatar", { length: 255 }),
  coverPhoto: varchar("cover_photo", { length: 255 }),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  resetPasswordTokenHash: varchar("reset_password_token_hash", { length: 64 }),
  resetPasswordExpiresAt: timestamp("reset_password_expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sports = pgTable("sports", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userSports = pgTable("user_sports", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sportId: uuid("sport_id").notNull().references(() => sports.id, { onDelete: "cascade" }),
  level: sportLevelEnum("level").notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.sportId] }),
}));

// Sports mis en favori par un utilisateur (indépendant de userSports, qui
// sert au profil "sports pratiqués + niveau"). Sert au comptage "membres".
export const sportFavorites = pgTable("sport_favorites", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sportId: uuid("sport_id").notNull().references(() => sports.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.sportId] }),
}));

export const activities = pgTable("activities", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 150 }).notNull(),
  description: text("description"),
  city: varchar("city", { length: 100 }).notNull(),
  startDate: timestamp("start_date").notNull(),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  levelRequired: sportLevelEnum("level_required").notNull(),
  maxParticipants: integer("max_participants").notNull(),
  status: activitiesStatusEnum("status").notNull().default("PENDING"),
  sportId: uuid("sport_id").notNull().references(() => sports.id),
  creatorId: uuid("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const participations = pgTable("participations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  activityId: uuid("activity_id").notNull().references(() => activities.id, { onDelete: "cascade" }),
  status: participationStatusEnum("status").notNull().default("PENDING"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  uniqueUserActivity: unique().on(t.userId, t.activityId),
}));

export const conversations = pgTable("conversations", {
    id:uuid("id").defaultRandom().primaryKey(),
    activityId: uuid("activity_id").notNull().unique().references(() => activities.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const messages = pgTable("messages", {
    id: uuid("id").defaultRandom().primaryKey(),
    contenu: text("contenu"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    usersId: uuid("users_id").notNull().references(()=>users.id, { onDelete: "cascade" }),
    conversationsId: uuid("conversations_id").notNull().references(()=>conversations.id, { onDelete: "cascade" }),
})

export const activityPhotos = pgTable("activity_photos", {
  id: uuid("id").defaultRandom().primaryKey(),
  activityId: uuid("activity_id").notNull().references(() => activities.id, { onDelete: "cascade" }),
  uploaderId: uuid("uploader_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  url: varchar("url", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
    id: uuid("id").defaultRandom().primaryKey(),
    type: varchar("type", { length: 100 }).notNull(),
    contenu: text("contenu"),
    estLu: boolean("est_lu").default(false),
    activityId: uuid("activity_id").references(() => activities.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    usersId: uuid("users_id").notNull().references(()=>users.id, { onDelete: "cascade" }),
})

export const opinion = pgTable("opinion", {
    id: uuid("id").defaultRandom().primaryKey(),
    notes: smallint("notes"),
    commentaire: text("commentaire"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    usersId: uuid("users_id").notNull().references(()=>users.id, { onDelete: "cascade" }),

})

