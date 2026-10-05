-- Garantit l'existence des territoires fondamentaux (66, 34) à l'issue des
-- migrations seules, sans dépendre de l'exécution préalable ou postérieure
-- de seed-territories.ts.
--
-- Cause du bug corrigé ici : la migration 20260921131458_add_territory_geo_and_branding
-- fait un UPDATE ciblé sur le territoire code='66' (en supposant qu'il existe
-- déjà) puis INSERT le territoire '34'. Sur une base neuve n'ayant jamais
-- exécuté seed-territories.ts avant cette migration, l'UPDATE ne touche
-- aucune ligne et '66' n'est jamais créé : seul '34' se retrouve en base
-- (inactif), ce qui casse tout le contexte territorial (hero sans tagline,
-- aucune activité affichée, TerritoryContext sans territoire actif).
--
-- Idempotente par construction (ON CONFLICT ("code") DO NOTHING) :
--   - base neuve (aucun des deux territoires)      -> les deux sont créés ;
--   - base ne contenant que '34' (cas identifié)   -> '34' intact, '66' créé ;
--   - base contenant déjà '66' et/ou '34'          -> aucun doublon, aucune
--     ligne existante écrasée (seul un backfill ciblé de colonnes encore
--     NULL sur '66' est appliqué, même principe que la migration d'origine).
-- Ne touche jamais users / user_territories / activities / isDefault.
-- Ne réactive jamais '34' : isActive=false reste la valeur d'amorçage,
-- une ligne déjà existante n'est de toute façon jamais modifiée sur cette
-- colonne par cette migration.
--
-- created_at fixé explicitement (plutôt que le défaut now()) : toute une
-- migration s'exécute dans UNE seule transaction, donc now() renverrait la
-- MÊME valeur pour les deux INSERT ci-dessous — un "66" et un "34" créés
-- strictement ex-aequo rendraient aléatoire l'ordre "premier territoire
-- actif" (ORDER BY created_at) dont dépend TerritoryService.resolveSignupTerritory
-- pour un visiteur/ancien client sans territoryCode. Écart d'une seconde,
-- largement suffisant, jamais réappliqué sur une ligne déjà existante
-- (ON CONFLICT DO NOTHING porte sur la ligne entière, pas seulement le code).

INSERT INTO "territories" ("code", "name", "slug", "brand_name", "insee_department_code", "tagline", "assets_path", "is_active", "created_at", "updated_at")
VALUES ('66', 'Pyrénées-Orientales', 'pyrenees-orientales', '66Partners', '66', 'Ton sport. Ton partenaire. Ton 66.', NULL, true, '2026-01-01 00:00:00', '2026-01-01 00:00:00')
ON CONFLICT ("code") DO NOTHING;
--> statement-breakpoint

-- Backfill ciblé (même garde que la migration d'origine) : complète
-- uniquement les colonnes encore NULL d'un '66' préexistant créé avant
-- l'ajout de ces colonnes — ne réécrit jamais une valeur déjà renseignée.
UPDATE "territories" SET "insee_department_code" = '66' WHERE "code" = '66' AND "insee_department_code" IS NULL;
--> statement-breakpoint
UPDATE "territories" SET "tagline" = 'Ton sport. Ton partenaire. Ton 66.' WHERE "code" = '66' AND "tagline" IS NULL;
--> statement-breakpoint

INSERT INTO "territories" ("code", "name", "slug", "brand_name", "insee_department_code", "tagline", "assets_path", "is_active", "created_at", "updated_at")
VALUES ('34', 'Hérault', 'herault', '34Partners', '34', 'Ton sport. Ton partenaire. Ton 34.', '/34partners', false, '2026-01-01 00:00:01', '2026-01-01 00:00:01')
ON CONFLICT ("code") DO NOTHING;
