CREATE TYPE "report_context" AS ENUM('PROFILE', 'MESSAGE', 'ACTIVITY', 'PHOTO');--> statement-breakpoint
CREATE TYPE "report_reason" AS ENUM('HARASSMENT', 'INAPPROPRIATE', 'SPAM', 'DANGEROUS', 'OTHER');--> statement-breakpoint
CREATE TYPE "report_status" AS ENUM('OPEN', 'RESOLVED');--> statement-breakpoint
CREATE TABLE "user_blocks" (
	"blocker_id" uuid,
	"blocked_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_blocks_pkey" PRIMARY KEY("blocker_id","blocked_id")
);
--> statement-breakpoint
CREATE TABLE "user_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"reporter_id" uuid,
	"reported_user_id" uuid,
	"context" "report_context" NOT NULL,
	"target_id" uuid,
	"target_excerpt" text,
	"reason" "report_reason" NOT NULL,
	"details" varchar(1000),
	"status" "report_status" DEFAULT 'OPEN'::"report_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE INDEX "user_blocks_blocked_id_idx" ON "user_blocks" ("blocked_id");--> statement-breakpoint
CREATE INDEX "user_reports_status_idx" ON "user_reports" ("status");--> statement-breakpoint
CREATE INDEX "user_reports_reported_user_id_idx" ON "user_reports" ("reported_user_id");--> statement-breakpoint
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocker_id_users_id_fkey" FOREIGN KEY ("blocker_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocked_id_users_id_fkey" FOREIGN KEY ("blocked_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_reporter_id_users_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_reported_user_id_users_id_fkey" FOREIGN KEY ("reported_user_id") REFERENCES "users"("id") ON DELETE SET NULL;