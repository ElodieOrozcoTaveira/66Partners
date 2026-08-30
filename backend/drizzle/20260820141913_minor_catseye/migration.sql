CREATE TABLE "activity_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"activity_id" uuid NOT NULL,
	"uploader_id" uuid NOT NULL,
	"url" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_photos" ADD CONSTRAINT "activity_photos_activity_id_activities_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "activity_photos" ADD CONSTRAINT "activity_photos_uploader_id_users_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "users"("id") ON DELETE CASCADE;