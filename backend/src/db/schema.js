import {
  integer,
  pgTable,
  varchar,
  pgEnum,
  uuid,
  timestamp,
  decimal,
  boolean,
  date,
  time,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";

export const userRoles = pgEnum("user_roles", [
  "HR_MANAGER",
  "ADMIN",
  "EMPLOYEE",
  "HR_PAYROLL",
  "PAYROLL_ADMIN",
]);
export const employmentStatus = pgEnum("employment_status", [
  "ACTIVE",
  "RESIGNED",
  "TERMINATED",
]);
export const contractStatus = pgEnum("contract_status", ["ACTIVE", "EXPIRED"]);
export const allocationNeed = pgEnum("allocation_needed", [
  "REQUIRED",
  "NOT_REQUIRED",
]);
export const allocationStatus = pgEnum("allocation_status", [
  "ACTIVE",
  "INACTIVE",
]);
export const allocationApprovalStatus = pgEnum("allocation_approval_status", [
  "APPROVED",
  "REJECTED",
  "PENDING",
]);
export const displayColour = pgEnum("display_colour", [
  "BLUE",
  "GREEN",
  "RED",
  "ORANGE",
]);
export const attendanceStatus = pgEnum("attendance_status", [
  "PRESENT",
  "ABSENT",
]);
export const timeoffUnit = pgEnum("timeoff_unit", ["DAY", "HOUR"]);
export const timeoffRequestStatus = pgEnum("timeoff_request_status", [
  "APPROVED",
  "REJECTED",
  "PENDING",
]);
export const daysOfWeek = pgEnum("days_of_week", [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
]);
export const salaryStructureStatus = pgEnum("salary_structure_status", [
  "ACTIVE",
  "INACTIVE",
]);
export const salaryRuleCategory = pgEnum("salary_rule_category", [
  "BASIC",
  "ALLOWANCE",
  "DEDUCTION",
]);
// NOTE: added "FORMULA" — PRD allows formula-based computation, only FIXED/PERCENTAGE
// were implemented before. Existing rows are unaffected since FIXED/PERCENTAGE stay valid.
export const computationMethod = pgEnum("computation_method", [
  "FIXED",
  "PERCENTAGE",
  "FORMULA",
]);
export const payrunStatus = pgEnum("payrun_status", [
  "DRAFT",
  "COMPUTED",
  "VALIDATED",
  "PAID",
]);
export const payslipStatus = pgEnum("payslip_status", [
  "DRAFT",
  "COMPUTED",
  "VALIDATED",
  "PAID",
]);

export const user = pgTable(
  "users",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    email: varchar("email", { length: 255 }).unique().notNull(),
    password: varchar("password", { length: 255 }).notNull(),
    role: userRoles("role").notNull().default("EMPLOYEE"),
    firstName: varchar("first_name", { length: 50 }).notNull(),
    lastName: varchar("last_name", { length: 50 }).notNull(),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    index("users_role_idx").on(table.role),
    uniqueIndex("users_email_idx").on(table.email),
  ],
);

export const session = pgTable(
  "sessions",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 255 }).notNull(),
    userAgent: varchar("user_agent", { length: 255 }).notNull(),
    ip: varchar("ip", { length: 50 }).notNull(),
    revoked: boolean().default(false).notNull(),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("sessions_user_id_idx").on(table.userId),
    uniqueIndex("sessions_token_idx").on(table.token),
  ],
);

export const employee = pgTable(
  "employees",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id),
    employeeId: integer("employee_id").notNull(),
    department: varchar("department", { length: 200 }).notNull(),
    designation: varchar("designation", { length: 200 }).notNull(),
    managerId: uuid("manager_id").references(() => employee.id),
    status: employmentStatus("status").notNull().default("ACTIVE"),
    workingWeeklyScheduleId: uuid("working_weekly_schedule_id").references(
      () => workingWeeklySchedule.id,
    ),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    index("employees_user_id_idx").on(table.userId),
    index("employees_manager_id_idx").on(table.managerId),
  ],
);

export const contract = pgTable(
  "contracts",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employee.id),
    startDate: date("start_date").notNull(),
    endDate: date("end_date"),
    status: contractStatus("status").notNull().default("ACTIVE"),
    salary: integer("salary").notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    validity: integer("validity").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("contracts_employee_id_idx").on(table.employeeId)],
);

export const workingWeeklySchedule = pgTable("working_weekly_schedules", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  name: varchar("name", { length: 100 }).notNull(),
  workingDays: integer("working_days").notNull(),
  workingHours: integer("working_hours").notNull(),
  totalWorkingHours: integer("total_working_hours").notNull().default(0),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const workingDaySchedule = pgTable("working_day_schedules", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  day: daysOfWeek("day").notNull().default("MONDAY"),
  workingWeeklyScheduleId: uuid("working_weekly_schedule_id")
    .notNull()
    .references(() => workingWeeklySchedule.id, { onDelete: "cascade" }),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  breakMinutes: integer("break_minutes").notNull(),
  dayHours: integer("day_hours").notNull(),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const attendance = pgTable(
  "attendances",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employee.id),
    date: date("date").notNull(),
    checkIn: timestamp("check_in", { withTimezone: true })
      .defaultNow()
      .notNull(),
    checkOut: timestamp("check_out", { withTimezone: true }),
    workedHours: integer("worked_hours").notNull().default(0),
    status: attendanceStatus("status").notNull().default("PRESENT"),
    overtimeHours: integer("overtime_hours").notNull().default(0),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("attendances_employee_id_idx").on(table.employeeId)],
);

export const timeoffType = pgTable("time_off_types", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  name: varchar("name", { length: 100 }).notNull(),
  unit: timeoffUnit("unit").notNull().default("DAY"),
  allocationNeed: allocationNeed("allocation_need")
    .notNull()
    .default("REQUIRED"),
  status: allocationStatus("status").notNull().default("ACTIVE"),
  displayColour: displayColour("display_colour").notNull().default("BLUE"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const timeoff = pgTable(
  "timeoffs",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employee.id),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }).notNull(),
    timeoffType: uuid("time_off_type")
      .notNull()
      .references(() => timeoffType.id),
    status: timeoffRequestStatus("status").notNull().default("PENDING"),
    approver: uuid("approver").references(() => user.id),

    reason: varchar("reason", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("timeoffs_employee_id_idx").on(table.employeeId),
    index("timeoffs_time_off_type_idx").on(table.timeoffType),
    index("timeoffs_approver_idx").on(table.approver),
  ],
);

export const allocation = pgTable(
  "allocations",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employee.id),
    timeoffTypeId: uuid("time_off_type_id")
      .notNull()
      .references(() => timeoffType.id),
    allocatedDays: integer("allocated_days").notNull(),
    takenDays: integer("taken_days").notNull(),
    remainingDays: integer("remaining_days").notNull(),
    validityYear: integer("validity_year").notNull(),
    status: allocationApprovalStatus("status").notNull().default("PENDING"),
    approver: uuid("approver").references(() => user.id),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("allocations_employee_id_idx").on(table.employeeId),
    index("allocations_time_off_type_id_idx").on(table.timeoffTypeId),
  ],
);

export const salaryStructure = pgTable("salary_structures", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  name: varchar("name", { length: 100 }).notNull(),
  status: salaryStructureStatus("status").notNull().default("ACTIVE"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const salaryRule = pgTable(
  "salary_rules",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    salaryStructureId: uuid("salary_structure_id")
      .notNull()
      .references(() => salaryStructure.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    code: varchar("code", { length: 50 }).notNull(),
    category: salaryRuleCategory("category").notNull(),
    sequence: integer("sequence").notNull(),
    computationMethod: computationMethod("computation_method").notNull(),
    amount: decimal("amount", { precision: 12, scale: 2 }),
    percentage: decimal("percentage", { precision: 5, scale: 2 }),
    percentageBaseCode: varchar("percentage_base_code", { length: 50 }),
    formula: varchar("formula", { length: 500 }),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("salary_rules_structure_id_idx").on(table.salaryStructureId),
    uniqueIndex("salary_rules_structure_code_idx").on(
      table.salaryStructureId,
      table.code,
    ),
  ],
);

export const payrun = pgTable(
  "payruns",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    name: varchar("name", { length: 100 }).notNull(),
    periodStart: date("period_start").notNull(),
    periodEnd: date("period_end").notNull(),
    salaryStructureId: uuid("salary_structure_id")
      .notNull()
      .references(() => salaryStructure.id),
    status: payrunStatus("status").notNull().default("DRAFT"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("payruns_salary_structure_id_idx").on(table.salaryStructureId),
  ],
);

export const payslip = pgTable(
  "payslips",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    payrunId: uuid("payrun_id")
      .notNull()
      .references(() => payrun.id, { onDelete: "cascade" }),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employee.id),
    contractId: uuid("contract_id").references(() => contract.id),
    basicSalary: decimal("basic_salary", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    grossSalary: decimal("gross_salary", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    netSalary: decimal("net_salary", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    status: payslipStatus("status").notNull().default("DRAFT"),
    warnings: varchar("warnings", { length: 500 }),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("payslips_payrun_id_idx").on(table.payrunId),
    index("payslips_employee_id_idx").on(table.employeeId),
    uniqueIndex("payslips_payrun_employee_idx").on(
      table.payrunId,
      table.employeeId,
    ),
  ],
);

export const payslipLine = pgTable(
  "payslip_lines",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    payslipId: uuid("payslip_id")
      .notNull()
      .references(() => payslip.id, { onDelete: "cascade" }),
    salaryRuleId: uuid("salary_rule_id")
      .notNull()
      .references(() => salaryRule.id),
    name: varchar("name", { length: 100 }).notNull(),
    code: varchar("code", { length: 50 }).notNull(),
    category: salaryRuleCategory("category").notNull(),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    sequence: integer("sequence").notNull(),

    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("payslip_lines_payslip_id_idx").on(table.payslipId)],
);