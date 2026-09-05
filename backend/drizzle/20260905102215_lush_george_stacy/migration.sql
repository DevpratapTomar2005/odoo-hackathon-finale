CREATE TYPE "days_of_week" AS ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');--> statement-breakpoint
CREATE TABLE "working_day_schedules" (
	"id" uuid PRIMARY KEY,
	"day" "days_of_week" DEFAULT 'MONDAY'::"days_of_week" NOT NULL,
	"working_weekly_schedule_id" uuid NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"break_minutes" integer NOT NULL,
	"day_hours" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "working_schedules" RENAME TO "working_weekly_schedules";--> statement-breakpoint
ALTER TABLE "working_weekly_schedules" DROP CONSTRAINT "working_schedules_employee_id_employees_id_fkey";--> statement-breakpoint
DROP INDEX "working_schedules_employee_id_idx";--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "working_weekly_schedule_id" uuid;--> statement-breakpoint
ALTER TABLE "working_weekly_schedules" ADD COLUMN "name" varchar(100) NOT NULL DEFAULT 'Default Schedule';--> statement-breakpoint
ALTER TABLE "working_weekly_schedules" ALTER COLUMN "name" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "working_weekly_schedules" DROP COLUMN "employee_id";--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_1LEIdTTXbvNi_fkey" FOREIGN KEY ("working_weekly_schedule_id") REFERENCES "working_weekly_schedules"("id");--> statement-breakpoint
ALTER TABLE "working_day_schedules" ADD CONSTRAINT "working_day_schedules_i38CaMUa1EVU_fkey" FOREIGN KEY ("working_weekly_schedule_id") REFERENCES "working_weekly_schedules"("id") ON DELETE CASCADE;