CREATE TABLE "sport_favorites" (
	"user_id" uuid NOT NULL,
	"sport_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sport_favorites_user_id_sport_id_pk" PRIMARY KEY("user_id","sport_id")
);
--> statement-breakpoint
ALTER TABLE "sport_favorites" ADD CONSTRAINT "sport_favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "sport_favorites" ADD CONSTRAINT "sport_favorites_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "sports"("id") ON DELETE cascade ON UPDATE no action;
