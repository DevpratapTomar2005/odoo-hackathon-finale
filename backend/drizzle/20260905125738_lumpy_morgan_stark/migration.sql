CREATE TYPE "allocation_needed" AS ENUM('REQUIRED', 'NOT_REQUIRED');--> statement-breakpoint
CREATE TYPE "allocation_status" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "attendance_status" AS ENUM('PRESENT', 'ABSENT');--> statement-breakpoint
CREATE TYPE "contract_status" AS ENUM('ACTIVE', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "days_of_week" AS ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');--> statement-breakpoint
CREATE TYPE "display_colour" AS ENUM('BLUE', 'GREEN', 'RED', 'ORANGE');--> statement-breakpoint
CREATE TYPE "employment_status" AS ENUM('ACTIVE', 'RESIGNED', 'TERMINATED');--> statement-breakpoint
CREATE TYPE "timeoff_request_status" AS ENUM('APPROVED', 'REJECTED', 'PENDING');--> statement-breakpoint
CREATE TYPE "timeoff_unit" AS ENUM('DAY', 'HOUR');--> statement-breakpoint
CREATE TYPE "user_roles" AS ENUM('HR_MANAGER', 'ADMIN', 'EMPLOYEE', 'HR_PAYROLL', 'PAYROLL_ADMIN');--> statement-breakpoint
CREATE TABLE "allocations" (
	"id" uuid PRIMARY KEY,
	"employee_id" uuid NOT NULL,
	"time_off_type_id" uuid NOT NULL,
	"allocated_days" integer NOT NULL,
	"taken_days" integer NOT NULL,
	"remaining_days" integer NOT NULL,
	"validity_year" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendances" (
	"id" uuid PRIMARY KEY,
	"employee_id" uuid NOT NULL,
	"date" date NOT NULL,
	"check_in" timestamp with time zone DEFAULT now() NOT NULL,
	"check_out" timestamp with time zone DEFAULT now() NOT NULL,
	"worked_hours" integer NOT NULL,
	"status" "attendance_status" DEFAULT 'PRESENT'::"attendance_status" NOT NULL,
	"overtime_hours" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" uuid PRIMARY KEY,
	"employee_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"status" "contract_status" DEFAULT 'ACTIVE'::"contract_status" NOT NULL,
	"salary" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"validity" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY,
	"user_id" uuid NOT NULL,
	"employee_id" integer NOT NULL,
	"department" varchar(200) NOT NULL,
	"designation" varchar(200) NOT NULL,
	"manager_id" uuid,
	"status" "employment_status" DEFAULT 'ACTIVE'::"employment_status" NOT NULL,
	"working_weekly_schedule_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY,
	"user_id" uuid NOT NULL,
	"token" varchar(255) NOT NULL,
	"user_agent" varchar(255) NOT NULL,
	"ip" varchar(50) NOT NULL,
	"revoked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timeoffs" (
	"id" uuid PRIMARY KEY,
	"employee_id" uuid NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"time_off_type" uuid NOT NULL,
	"status" "timeoff_request_status" DEFAULT 'PENDING'::"timeoff_request_status" NOT NULL,
	"approver" uuid,
	"reason" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "time_off_types" (
	"id" uuid PRIMARY KEY,
	"name" varchar(100) NOT NULL,
	"unit" "timeoff_unit" DEFAULT 'DAY'::"timeoff_unit" NOT NULL,
	"allocation_need" "allocation_needed" DEFAULT 'REQUIRED'::"allocation_needed" NOT NULL,
	"status" "allocation_status" DEFAULT 'ACTIVE'::"allocation_status" NOT NULL,
	"display_colour" "display_colour" DEFAULT 'BLUE'::"display_colour" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY,
	"email" varchar(255) NOT NULL UNIQUE,
	"password" varchar(255) NOT NULL,
	"role" "user_roles" DEFAULT 'EMPLOYEE'::"user_roles" NOT NULL,
	"first_name" varchar(50) NOT NULL,
	"last_name" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
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
CREATE TABLE "working_weekly_schedules" (
	"id" uuid PRIMARY KEY,
	"name" varchar(100) NOT NULL,
	"working_days" integer NOT NULL,
	"working_hours" integer NOT NULL,
	"total_working_hours" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "allocations_employee_id_idx" ON "allocations" ("employee_id");--> statement-breakpoint
CREATE INDEX "allocations_time_off_type_id_idx" ON "allocations" ("time_off_type_id");--> statement-breakpoint
CREATE INDEX "attendances_employee_id_idx" ON "attendances" ("employee_id");--> statement-breakpoint
CREATE INDEX "contracts_employee_id_idx" ON "contracts" ("employee_id");--> statement-breakpoint
CREATE INDEX "employees_user_id_idx" ON "employees" ("user_id");--> statement-breakpoint
CREATE INDEX "employees_manager_id_idx" ON "employees" ("manager_id");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_idx" ON "sessions" ("token");--> statement-breakpoint
CREATE INDEX "timeoffs_employee_id_idx" ON "timeoffs" ("employee_id");--> statement-breakpoint
CREATE INDEX "timeoffs_time_off_type_idx" ON "timeoffs" ("time_off_type");--> statement-breakpoint
CREATE INDEX "timeoffs_approver_idx" ON "timeoffs" ("approver");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" ("role");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" ("email");--> statement-breakpoint
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_employee_id_employees_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id");--> statement-breakpoint
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_time_off_type_id_time_off_types_id_fkey" FOREIGN KEY ("time_off_type_id") REFERENCES "time_off_types"("id");--> statement-breakpoint
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_employee_id_employees_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id");--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_employee_id_employees_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id");--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_manager_id_employees_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "employees"("id");--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_1LEIdTTXbvNi_fkey" FOREIGN KEY ("working_weekly_schedule_id") REFERENCES "working_weekly_schedules"("id");--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "timeoffs" ADD CONSTRAINT "timeoffs_employee_id_employees_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id");--> statement-breakpoint
ALTER TABLE "timeoffs" ADD CONSTRAINT "timeoffs_time_off_type_time_off_types_id_fkey" FOREIGN KEY ("time_off_type") REFERENCES "time_off_types"("id");--> statement-breakpoint
ALTER TABLE "timeoffs" ADD CONSTRAINT "timeoffs_approver_users_id_fkey" FOREIGN KEY ("approver") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "working_day_schedules" ADD CONSTRAINT "working_day_schedules_i38CaMUa1EVU_fkey" FOREIGN KEY ("working_weekly_schedule_id") REFERENCES "working_weekly_schedules"("id") ON DELETE CASCADE;