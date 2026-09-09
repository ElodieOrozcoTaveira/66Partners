CREATE TABLE "social_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"provider" varchar(32) NOT NULL,
	"provider_user_id" varchar(255) NOT NULL,
	"email" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "social_accounts_provider_provider_user_id_unique" UNIQUE("provider","provider_user_id")
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;--> statement-breakpoint
CREATE INDEX "social_accounts_user_id_idx" ON "social_accounts" ("user_id");--> statement-breakpoint
ALTER TABLE "social_accounts" ADD CONSTRAINT "social_accounts_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;