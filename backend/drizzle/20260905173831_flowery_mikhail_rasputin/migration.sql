CREATE TYPE "computation_method" AS ENUM('FIXED', 'PERCENTAGE');--> statement-breakpoint
CREATE TYPE "payrun_status" AS ENUM('DRAFT', 'COMPUTED', 'VALIDATED', 'PAID');--> statement-breakpoint
CREATE TYPE "payslip_status" AS ENUM('DRAFT', 'COMPUTED', 'VALIDATED', 'PAID');--> statement-breakpoint
CREATE TYPE "salary_rule_category" AS ENUM('BASIC', 'ALLOWANCE', 'DEDUCTION');--> statement-breakpoint
CREATE TYPE "salary_structure_status" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TABLE "payruns" (
	"id" uuid PRIMARY KEY,
	"name" varchar(100) NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"salary_structure_id" uuid NOT NULL,
	"status" "payrun_status" DEFAULT 'DRAFT'::"payrun_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payslips" (
	"id" uuid PRIMARY KEY,
	"payrun_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"contract_id" uuid,
	"basic_salary" numeric(12,2) DEFAULT '0' NOT NULL,
	"gross_salary" numeric(12,2) DEFAULT '0' NOT NULL,
	"net_salary" numeric(12,2) DEFAULT '0' NOT NULL,
	"status" "payslip_status" DEFAULT 'DRAFT'::"payslip_status" NOT NULL,
	"warnings" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payslip_lines" (
	"id" uuid PRIMARY KEY,
	"payslip_id" uuid NOT NULL,
	"salary_rule_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(50) NOT NULL,
	"category" "salary_rule_category" NOT NULL,
	"amount" numeric(12,2) NOT NULL,
	"sequence" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salary_rules" (
	"id" uuid PRIMARY KEY,
	"salary_structure_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(50) NOT NULL,
	"category" "salary_rule_category" NOT NULL,
	"sequence" integer NOT NULL,
	"computation_method" "computation_method" NOT NULL,
	"amount" numeric(12,2),
	"percentage" numeric(5,2),
	"percentage_base_code" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salary_structures" (
	"id" uuid PRIMARY KEY,
	"name" varchar(100) NOT NULL,
	"status" "salary_structure_status" DEFAULT 'ACTIVE'::"salary_structure_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "payruns_salary_structure_id_idx" ON "payruns" ("salary_structure_id");--> statement-breakpoint
CREATE INDEX "payslips_payrun_id_idx" ON "payslips" ("payrun_id");--> statement-breakpoint
CREATE INDEX "payslips_employee_id_idx" ON "payslips" ("employee_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payslips_payrun_employee_idx" ON "payslips" ("payrun_id","employee_id");--> statement-breakpoint
CREATE INDEX "payslip_lines_payslip_id_idx" ON "payslip_lines" ("payslip_id");--> statement-breakpoint
CREATE INDEX "salary_rules_structure_id_idx" ON "salary_rules" ("salary_structure_id");--> statement-breakpoint
CREATE UNIQUE INDEX "salary_rules_structure_code_idx" ON "salary_rules" ("salary_structure_id","code");--> statement-breakpoint
ALTER TABLE "payruns" ADD CONSTRAINT "payruns_salary_structure_id_salary_structures_id_fkey" FOREIGN KEY ("salary_structure_id") REFERENCES "salary_structures"("id");--> statement-breakpoint
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_payrun_id_payruns_id_fkey" FOREIGN KEY ("payrun_id") REFERENCES "payruns"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_employee_id_employees_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id");--> statement-breakpoint
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_contract_id_contracts_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id");--> statement-breakpoint
ALTER TABLE "payslip_lines" ADD CONSTRAINT "payslip_lines_payslip_id_payslips_id_fkey" FOREIGN KEY ("payslip_id") REFERENCES "payslips"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "payslip_lines" ADD CONSTRAINT "payslip_lines_salary_rule_id_salary_rules_id_fkey" FOREIGN KEY ("salary_rule_id") REFERENCES "salary_rules"("id");--> statement-breakpoint
ALTER TABLE "salary_rules" ADD CONSTRAINT "salary_rules_salary_structure_id_salary_structures_id_fkey" FOREIGN KEY ("salary_structure_id") REFERENCES "salary_structures"("id") ON DELETE CASCADE;