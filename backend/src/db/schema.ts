import {
  pgTable, uuid, varchar, text, timestamp, integer, smallint, boolean, pgEnum, unique, primaryKey, doublePrecision, index, uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const sportLevelEnum = pgEnum("sport_level", ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]);
export const participationStatusEnum = pgEnum("participation_status", ["PENDING", "ACCEPTED", "REFUSED"]);
export const activitiesStatusEnum = pgEnum("activities_status", ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]);
export const weekdayEnum = pgEnum("weekday", [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
]);



export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  // Nullable : un compte créé via un fournisseur d'identité social (Google,
  // cf. social_accounts) n'a pas de mot de passe 66Partners tant qu'il n'en
  // définit pas un lui-même. AuthService.authenticateUser() traite un
  // password null comme des identifiants invalides, jamais comme un crash.
  password: varchar("password", { length: 255 }),
  pseudo: varchar("pseudo", { length: 100 }).notNull(),
  city: varchar("city", { length: 100 }),
  // Les 3 lignes de la carte "à propos" du profil (icônes fixes côté
  // frontend) — remplacent l'ancien champ bio (paragraphe libre), qui ne
  // mappait pas proprement sur ce format à 3 lignes structurées.
  headline: varchar("headline", { length: 200 }),
  lookingFor: varchar("looking_for", { length: 200 }),
  openTo: varchar("open_to", { length: 200 }),
  avatar: varchar("avatar", { length: 255 }),
  coverPhoto: varchar("cover_photo", { length: 255 }),
  resetPasswordTokenHash: varchar("reset_password_token_hash", { length: 64 }),
  resetPasswordExpiresAt: timestamp("reset_password_expires_at"),
  // Preuve d'acceptation explicite des CGU/Mentions légales/Politique de
  // confidentialité à l'inscription (cf. P1 audit RGPD). Nullable : les
  // comptes créés avant l'introduction de cette exigence n'ont pas cette
  // preuve et ne sont pas invités à l'accepter rétroactivement.
  termsAcceptedAt: timestamp("terms_accepted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Créneaux de disponibilité récurrents affichés sur le profil ("Lundi
// 18h-20h", ...). startTime/endTime en "HH:mm" (comparaison lexicale valide
// pour un format zero-paddé) : pas besoin du type `time` de Postgres ici.
export const availabilities = pgTable("availabilities", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  weekday: weekdayEnum("weekday").notNull(),
  startTime: varchar("start_time", { length: 5 }).notNull(),
  endTime: varchar("end_time", { length: 5 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("availabilities_user_id_idx").on(t.userId),
}));

// Une déclinaison territoriale de la plateforme Partners (66Partners,
// 34Partners, ...). isActive sert uniquement à déterminer le(s) territoire(s)
// proposé(s) par défaut à un NOUVEL inscrit (cf. TerritoryService) — ça ne
// déclenche jamais de rattachement rétroactif des comptes existants.
export const territories = pgTable("territories", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 10 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  brandName: varchar("brand_name", { length: 100 }).notNull(),
  logoUrl: varchar("logo_url", { length: 255 }),
  primaryColor: varchar("primary_color", { length: 20 }),
  secondaryColor: varchar("secondary_color", { length: 20 }),
  isActive: boolean("is_active").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relation many-to-many : un compte utilisateur global peut être rattaché à
// plusieurs territoires (aujourd'hui uniquement le 66).
export const userTerritories = pgTable("user_territories", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  territoryId: uuid("territory_id").notNull().references(() => territories.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  isDefault: boolean("is_default").notNull().default(false),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.territoryId] }),
  // Garde-fou d'intégrité : au plus UN territoire par défaut par utilisateur.
  // TerritoryService.attachUserToActiveTerritories() ne pose déjà qu'un seul
  // isDefault=true (le premier territoire actif) — cet index partiel rend
  // cette invariante impossible à violer même par un futur bug ou un accès
  // direct à la base, sans jamais limiter le nombre de territoires par
  // utilisateur (multi-appartenance toujours possible).
  oneDefaultPerUser: uniqueIndex("user_territories_one_default_per_user")
    .on(t.userId)
    .where(sql`${t.isDefault} = true`),
}));

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
  // Territoire dans lequel l'activité se déroule (pas le territoire
  // d'origine du créateur). Backfillé pour les données existantes
  // (cf. seed-territories.ts) avant ce passage en NOT NULL.
  territoryId: uuid("territory_id").notNull().references(() => territories.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  territoryIdx: index("activities_territory_id_idx").on(t.territoryId),
}));

export const participations = pgTable("participations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  activityId: uuid("activity_id").notNull().references(() => activities.id, { onDelete: "cascade" }),
  status: participationStatusEnum("status").notNull().default("PENDING"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  uniqueUserActivity: unique().on(t.userId, t.activityId),
  // La contrainte unique ci-dessus (user_id, activity_id) ne couvre pas les
  // recherches par activity_id seul (ex. liste des participants d'une
  // activité) — colonne pourtant filtrée directement à de nombreux endroits
  // (participation.services.ts, conversation.services.ts, activity.services.ts).
  activityIdx: index("participations_activity_id_idx").on(t.activityId),
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
}, (t) => ({
  // conversationsId : filtré directement à chaque chargement de messages
  // (getMessages, listMine). usersId : jamais filtré directement aujourd'hui,
  // mais indexé pour la suppression en cascade d'un compte (ON DELETE CASCADE
  // sans index = balayage complet de la table à chaque suppression d'utilisateur).
  conversationsIdx: index("messages_conversations_id_idx").on(t.conversationsId),
  usersIdx: index("messages_users_id_idx").on(t.usersId),
}))

export const activityPhotos = pgTable("activity_photos", {
  id: uuid("id").defaultRandom().primaryKey(),
  activityId: uuid("activity_id").notNull().references(() => activities.id, { onDelete: "cascade" }),
  uploaderId: uuid("uploader_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  url: varchar("url", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  // Filtré directement à chaque affichage des photos d'une activité
  // (listPhotos, ActivityService.getActivityById).
  activityIdx: index("activity_photos_activity_id_idx").on(t.activityId),
}));

export const notifications = pgTable("notifications", {
    id: uuid("id").defaultRandom().primaryKey(),
    type: varchar("type", { length: 100 }).notNull(),
    contenu: text("contenu"),
    estLu: boolean("est_lu").default(false),
    activityId: uuid("activity_id").references(() => activities.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    usersId: uuid("users_id").notNull().references(()=>users.id, { onDelete: "cascade" }),
}, (t) => ({
  // usersId : filtré directement à chaque liste/comptage de notifications
  // et à chaque marquage lu (notification.services.ts, 4 occurrences).
  usersIdx: index("notifications_users_id_idx").on(t.usersId),
}))

// Un abonnement navigateur/PWA aux notifications push (Web Push standard,
// cf. push.services.ts). Un même utilisateur peut avoir plusieurs
// abonnements (plusieurs appareils/navigateurs) : l'endpoint identifie de
// façon unique un couple navigateur+appareil, donné par le navigateur lui-même.
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("push_subscriptions_user_id_idx").on(t.userId),
}));

// Fournisseurs d'identité externes rattachés à un compte 66Partners (Google
// pour l'instant, potentiellement Facebook plus tard — table dédiée plutôt
// que de surcharger `users`, pour permettre plusieurs fournisseurs par
// utilisateur sans jamais faire du social la seule voie d'authentification).
// provider_user_id = claim "sub" du token du fournisseur (jamais l'email
// seul : Google recommande "sub" comme identifiant stable et unique).
export const socialAccounts = pgTable("social_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 32 }).notNull(),
  providerUserId: varchar("provider_user_id", { length: 255 }).notNull(),
  // Email tel que renvoyé par le fournisseur au moment de la liaison — pour
  // affichage/traçabilité uniquement, jamais utilisé comme identifiant de
  // connexion (c'est provider_user_id qui identifie le compte social).
  email: varchar("email", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("social_accounts_user_id_idx").on(t.userId),
  providerAccountUnique: unique("social_accounts_provider_provider_user_id_unique").on(
    t.provider,
    t.providerUserId,
  ),
}));

export const opinion = pgTable("opinion", {
    id: uuid("id").defaultRandom().primaryKey(),
    notes: smallint("notes"),
    commentaire: text("commentaire"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    usersId: uuid("users_id").notNull().references(()=>users.id, { onDelete: "cascade" }),

})

