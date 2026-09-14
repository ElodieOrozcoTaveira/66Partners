CREATE TABLE "admin_credentials" (
	"id" integer PRIMARY KEY DEFAULT 1,
	"password_hash" varchar(255) NOT NULL,
	"reset_token_hash" varchar(64),
	"reset_token_expires_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
