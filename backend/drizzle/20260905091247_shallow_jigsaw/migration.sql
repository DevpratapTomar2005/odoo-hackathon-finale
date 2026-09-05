ALTER TABLE "employees" DROP CONSTRAINT "employees_company_id_companies_id_fkey";--> statement-breakpoint
DROP TABLE "companies";--> statement-breakpoint
DROP INDEX "employees_company_id_idx";--> statement-breakpoint
ALTER TABLE "employees" DROP COLUMN "company_id";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET NOT NULL;