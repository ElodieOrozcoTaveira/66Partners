CREATE TABLE "activity_reminders" (
	"activity_id" uuid,
	"user_id" uuid,
	"kind" varchar(10),
	"sent_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "activity_reminders_pkey" PRIMARY KEY("activity_id","user_id","kind")
);
--> statement-breakpoint
ALTER TABLE "activity_reminders" ADD CONSTRAINT "activity_reminders_activity_id_activities_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "activity_reminders" ADD CONSTRAINT "activity_reminders_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;