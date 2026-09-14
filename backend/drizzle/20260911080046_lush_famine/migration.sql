ALTER TABLE "conversations" DROP CONSTRAINT "conversations_activity_id_key";--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "carpool_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "participant_id" uuid;--> statement-breakpoint
ALTER TABLE "participations" ADD COLUMN "carpool_requested" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "conversations_activity_group_unique" ON "conversations" ("activity_id") WHERE "participant_id" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "conversations_activity_participant_unique" ON "conversations" ("activity_id","participant_id") WHERE "participant_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_participant_id_users_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "users"("id") ON DELETE CASCADE;