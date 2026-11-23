CREATE TABLE "user_map_profiles" (
	"user_id" uuid PRIMARY KEY,
	"insee_code" varchar(5) NOT NULL,
	"sector_name" varchar(100) NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"show_age" boolean DEFAULT false NOT NULL,
	"consented_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "user_map_profiles_latitude_idx" ON "user_map_profiles" ("latitude");--> statement-breakpoint
ALTER TABLE "user_map_profiles" ADD CONSTRAINT "user_map_profiles_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;