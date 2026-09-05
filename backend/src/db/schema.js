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

export const user = pgTable("users", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  role: userRoles("role").notNull().default("EMPLOYEE"),
  firstName: varchar("first_name", { length: 50 }).notNull(),
  lastName: varchar("last_name", { length: 50 }).notNull(),
  isVerified: boolean().default(false).notNull(),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (table) => [
  index("users_role_idx").on(table.role),
  uniqueIndex("users_email_idx").on(table.email),
]);

export const session = pgTable("sessions", {
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
}, (table) => [
  index("sessions_user_id_idx").on(table.userId),
  uniqueIndex("sessions_token_idx").on(table.token),
]);

export const otp = pgTable("otps", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  email: varchar("email", { length: 255 }).unique().notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  otp: varchar("otp", { length: 6 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("otps_user_id_idx").on(table.userId),
]);

export const company = pgTable("companies", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  name: varchar("name", { length: 200 }).notNull(),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const employee = pgTable("employees", {
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
  companyId: uuid("company_id")
    .notNull()
    .references(() => company.id),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (table) => [
  index("employees_user_id_idx").on(table.userId),
  index("employees_company_id_idx").on(table.companyId),
  index("employees_manager_id_idx").on(table.managerId),
]);

export const contract = pgTable("contracts", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employee.id),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  status: contractStatus("status").notNull().default("ACTIVE"),
  salary: integer("salary").notNull(),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("contracts_employee_id_idx").on(table.employeeId),
]);

export const workingSchedule = pgTable("working_schedules", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employee.id),
  workingDays: integer("working_days").notNull(),
  workingHours: integer("working_hours").notNull(),
  totalWorkingHours: integer("total_working_hours")
    .notNull()
    .default(0),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("working_schedules_employee_id_idx").on(table.employeeId),
]);

export const attendance = pgTable("attendances", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employee.id),
  date: date("date").notNull(),
  checkIn: timestamp("check_in", { withTimezone: true }).defaultNow().notNull(),
  checkOut: timestamp("check_out", { withTimezone: true }).defaultNow().notNull(),
  workedHours: integer("worked_hours").notNull(),
  status: attendanceStatus("status").notNull().default("PRESENT"),
  overtimeHours: integer("overtime_hours").notNull().default(0),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("attendances_employee_id_idx").on(table.employeeId),
]);

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

export const timeoff = pgTable("timeoffs", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employee.id),
  startDate: timestamp("start_date",{withTimezone:true}).notNull(),
  endDate: timestamp("end_date",{withTimezone:true}).notNull(),
  timeoffType: uuid("time_off_type")
    .notNull()
    .references(() => timeoffType.id),
  status: timeoffRequestStatus("status").notNull().default("PENDING"),
  approver: uuid("approver").references(() => user.id),

  reason: varchar("reason", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("timeoffs_employee_id_idx").on(table.employeeId),
  index("timeoffs_time_off_type_idx").on(table.timeoffType),
  index("timeoffs_approver_idx").on(table.approver),
]);

export const allocation = pgTable("allocations", {
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

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("allocations_employee_id_idx").on(table.employeeId),
  index("allocations_time_off_type_id_idx").on(table.timeoffTypeId),
]);
