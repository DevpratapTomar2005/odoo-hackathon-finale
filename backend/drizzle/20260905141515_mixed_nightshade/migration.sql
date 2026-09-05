ALTER TABLE "attendances" ALTER COLUMN "check_out" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "attendances" ALTER COLUMN "check_out" DROP NOT NULL;