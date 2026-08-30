ALTER TABLE "users" ADD COLUMN "reset_password_token_hash" varchar(64);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reset_password_expires_at" timestamp;