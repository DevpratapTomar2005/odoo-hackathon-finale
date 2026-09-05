ALTER TYPE "computation_method" ADD VALUE 'FORMULA';--> statement-breakpoint
ALTER TABLE "salary_rules" ADD COLUMN "formula" varchar(500);