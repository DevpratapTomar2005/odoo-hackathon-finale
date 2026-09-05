ALTER TYPE "attendence_status" RENAME TO "attendance_status";--> statement-breakpoint
ALTER TYPE "typeoff_unit" RENAME TO "timeoff_unit";--> statement-breakpoint
ALTER TABLE "attendences" RENAME TO "attendances";--> statement-breakpoint
ALTER INDEX "attendences_employee_id_idx" RENAME TO "attendances_employee_id_idx";--> statement-breakpoint
ALTER TABLE "attendances" RENAME CONSTRAINT "attendences_employee_id_employees_id_fkey" TO "attendances_employee_id_employees_id_fkey";--> statement-breakpoint
ALTER TABLE "employees" RENAME CONSTRAINT "employees_manager_id_users_id_fkey" TO "employees_manager_id_employees_id_fkey";--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "contracts" ALTER COLUMN "salary" SET DATA TYPE integer USING "salary"::integer;--> statement-breakpoint
ALTER TABLE "timeoffs" ALTER COLUMN "start_date" SET DATA TYPE timestamp with time zone USING "start_date"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "timeoffs" ALTER COLUMN "end_date" SET DATA TYPE timestamp with time zone USING "end_date"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "working_schedules" ALTER COLUMN "total_working_hours" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "allocations" DROP CONSTRAINT "allocations_employee_id_employees_id_fkey", ADD CONSTRAINT "allocations_employee_id_employees_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id");--> statement-breakpoint
ALTER TABLE "attendances" DROP CONSTRAINT "attendances_employee_id_employees_id_fkey", ADD CONSTRAINT "attendances_employee_id_employees_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id");--> statement-breakpoint
ALTER TABLE "contracts" DROP CONSTRAINT "contracts_employee_id_employees_id_fkey", ADD CONSTRAINT "contracts_employee_id_employees_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id");--> statement-breakpoint
ALTER TABLE "employees" DROP CONSTRAINT "employees_manager_id_employees_id_fkey", ADD CONSTRAINT "employees_manager_id_employees_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "employees"("id");--> statement-breakpoint
ALTER TABLE "timeoffs" DROP CONSTRAINT "timeoffs_employee_id_employees_id_fkey", ADD CONSTRAINT "timeoffs_employee_id_employees_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id");--> statement-breakpoint
ALTER TABLE "working_schedules" DROP CONSTRAINT "working_schedules_employee_id_employees_id_fkey", ADD CONSTRAINT "working_schedules_employee_id_employees_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id");