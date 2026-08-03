CREATE TYPE "activities_status" AS ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "participation_status" AS ENUM('PENDING', 'ACCEPTED', 'REFUSED');--> statement-breakpoint
CREATE TYPE "sport_level" AS ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');--> statement-breakpoint
CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"title" varchar(150) NOT NULL,
	"description" text,
	"city" varchar(100) NOT NULL,
	"start_date" timestamp NOT NULL,
	"latitude" double precision,
	"longitude" double precision,
	"level_required" "sport_level" NOT NULL,
	"max_participants" integer NOT NULL,
	"status" "activities_status" DEFAULT 'PENDING'::"activities_status" NOT NULL,
	"sport_id" uuid NOT NULL,
	"creator_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"activity_id" uuid NOT NULL UNIQUE,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"contenu" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"users_id" uuid NOT NULL,
	"conversations_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"type" varchar(100) NOT NULL,
	"contenu" text,
	"est_lu" boolean,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"users_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "opinion" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"notes" smallint,
	"commentaire" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"users_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "participations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"activity_id" uuid NOT NULL,
	"status" "participation_status" DEFAULT 'PENDING'::"participation_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "participations_user_id_activity_id_unique" UNIQUE("user_id","activity_id")
);
--> statement-breakpoint
CREATE TABLE "sport_favorites" (
	"user_id" uuid,
	"sport_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sport_favorites_pkey" PRIMARY KEY("user_id","sport_id")
);
--> statement-breakpoint
CREATE TABLE "sports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(100) NOT NULL UNIQUE,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_sports" (
	"user_id" uuid,
	"sport_id" uuid,
	"level" "sport_level" NOT NULL,
	CONSTRAINT "user_sports_pkey" PRIMARY KEY("user_id","sport_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"email" varchar(255) NOT NULL UNIQUE,
	"password" varchar(255) NOT NULL,
	"pseudo" varchar(100) NOT NULL,
	"city" varchar(100),
	"bio" text,
	"avatar" varchar(255),
	"latitude" double precision,
	"longitude" double precision,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_sport_id_sports_id_fkey" FOREIGN KEY ("sport_id") REFERENCES "sports"("id");--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_creator_id_users_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_activity_id_activities_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_users_id_users_id_fkey" FOREIGN KEY ("users_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversations_id_conversations_id_fkey" FOREIGN KEY ("conversations_id") REFERENCES "conversations"("id");--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_users_id_users_id_fkey" FOREIGN KEY ("users_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "opinion" ADD CONSTRAINT "opinion_users_id_users_id_fkey" FOREIGN KEY ("users_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "participations" ADD CONSTRAINT "participations_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "participations" ADD CONSTRAINT "participations_activity_id_activities_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sport_favorites" ADD CONSTRAINT "sport_favorites_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sport_favorites" ADD CONSTRAINT "sport_favorites_sport_id_sports_id_fkey" FOREIGN KEY ("sport_id") REFERENCES "sports"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_sports" ADD CONSTRAINT "user_sports_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_sports" ADD CONSTRAINT "user_sports_sport_id_sports_id_fkey" FOREIGN KEY ("sport_id") REFERENCES "sports"("id") ON DELETE CASCADE;