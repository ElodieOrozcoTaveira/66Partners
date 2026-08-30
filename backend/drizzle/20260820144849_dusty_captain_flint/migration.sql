ALTER TABLE "notifications" ADD COLUMN "activity_id" uuid;--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "est_lu" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_activity_id_activities_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_users_id_users_id_fkey", ADD CONSTRAINT "notifications_users_id_users_id_fkey" FOREIGN KEY ("users_id") REFERENCES "users"("id") ON DELETE CASCADE;