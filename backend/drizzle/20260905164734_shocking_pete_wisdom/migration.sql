CREATE TYPE "allocation_approval_status" AS ENUM('APPROVED', 'REJECTED', 'PENDING');--> statement-breakpoint
ALTER TABLE "allocations" ADD COLUMN "status" "allocation_approval_status" DEFAULT 'PENDING'::"allocation_approval_status" NOT NULL;--> statement-breakpoint
ALTER TABLE "allocations" ADD COLUMN "approver" uuid;--> statement-breakpoint
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_approver_users_id_fkey" FOREIGN KEY ("approver") REFERENCES "users"("id");