ALTER TABLE "users" ADD COLUMN "headline" varchar(200);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "looking_for" varchar(200);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "open_to" varchar(200);--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "bio";