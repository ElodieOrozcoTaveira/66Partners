CREATE TABLE "territories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" varchar(10) NOT NULL UNIQUE,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL UNIQUE,
	"brand_name" varchar(100) NOT NULL,
	"logo_url" varchar(255),
	"primary_color" varchar(20),
	"secondary_color" varchar(20),
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_territories" (
	"user_id" uuid,
	"territory_id" uuid,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	CONSTRAINT "user_territories_pkey" PRIMARY KEY("user_id","territory_id")
);
--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "territory_id" uuid;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_territory_id_territories_id_fkey" FOREIGN KEY ("territory_id") REFERENCES "territories"("id");--> statement-breakpoint
ALTER TABLE "user_territories" ADD CONSTRAINT "user_territories_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_territories" ADD CONSTRAINT "user_territories_territory_id_territories_id_fkey" FOREIGN KEY ("territory_id") REFERENCES "territories"("id") ON DELETE CASCADE;