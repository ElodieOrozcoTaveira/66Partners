CREATE TABLE "admin_push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"endpoint" text NOT NULL UNIQUE,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
