CREATE INDEX "activity_photos_activity_id_idx" ON "activity_photos" ("activity_id");--> statement-breakpoint
CREATE INDEX "messages_conversations_id_idx" ON "messages" ("conversations_id");--> statement-breakpoint
CREATE INDEX "messages_users_id_idx" ON "messages" ("users_id");--> statement-breakpoint
CREATE INDEX "notifications_users_id_idx" ON "notifications" ("users_id");--> statement-breakpoint
CREATE INDEX "participations_activity_id_idx" ON "participations" ("activity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_territories_one_default_per_user" ON "user_territories" ("user_id") WHERE "is_default" = true;