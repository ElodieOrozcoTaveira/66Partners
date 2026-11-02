CREATE TYPE "activity_audience" AS ENUM('ALL', 'WOMEN', 'MEN');--> statement-breakpoint
CREATE TYPE "gender" AS ENUM('FEMALE', 'MALE');--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "audience" "activity_audience" DEFAULT 'ALL'::"activity_audience" NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "gender" "gender";