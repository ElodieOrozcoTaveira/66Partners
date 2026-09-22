ALTER TABLE "territories" ADD COLUMN "insee_department_code" varchar(3);--> statement-breakpoint
ALTER TABLE "territories" ADD COLUMN "tagline" varchar(200);--> statement-breakpoint
ALTER TABLE "territories" ADD COLUMN "assets_path" varchar(100);--> statement-breakpoint
UPDATE "territories" SET "insee_department_code" = '66', "tagline" = 'Ton sport. Ton partenaire. Ton 66.' WHERE "code" = '66' AND "insee_department_code" IS NULL;--> statement-breakpoint
INSERT INTO "territories" ("code", "name", "slug", "brand_name", "insee_department_code", "tagline", "assets_path", "is_active") VALUES ('34', 'Hérault', 'herault', '34Partners', '34', 'Ton sport. Ton partenaire. Ton 34.', '/34partners', false) ON CONFLICT ("code") DO NOTHING;
