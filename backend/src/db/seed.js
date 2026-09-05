import { db, connectDB } from "./db.js";
import {
  user,
  session,
  employee,
  timeoffType,
  contract,
  workingWeeklySchedule,
  workingDaySchedule,
  attendance,
  timeoff,
  allocation,
  salaryStructure,
  salaryRule,
  payrun,
  payslip,
  payslipLine,
} from "./schema.js";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

const seed = async () => {
  try {
    await connectDB();

    const adminEmail = "admin@odoo.com";
    const adminPasswordPlain = "Admin@1234";
    const hashedAdminPassword = await bcrypt.hash(adminPasswordPlain, 10);

    let [adminUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, adminEmail));

    if (!adminUser) {
      [adminUser] = await db
        .insert(user)
        .values({
          email: adminEmail,
          password: hashedAdminPassword,
          role: "ADMIN",
          firstName: "Super",
          lastName: "Admin",
        })
        .returning();
    }

    let [adminSession] = await db
      .select()
      .from(session)
      .where(eq(session.userId, adminUser.id));

    if (!adminSession) {
      await db.insert(session).values({
        userId: adminUser.id,
        token: "seed-test-token-admin-1234",
        userAgent: "Seeder/1.0",
        ip: "127.0.0.1",
        revoked: true,
      });
    }

    let [adminEmployee] = await db
      .select()
      .from(employee)
      .where(eq(employee.userId, adminUser.id));

    if (!adminEmployee) {
      [adminEmployee] = await db
        .insert(employee)
        .values({
          userId: adminUser.id,
          employeeId: 1001,
          department: "Administration",
          designation: "Chief Administrator",
          status: "ACTIVE",
        })
        .returning();
    }

    const empEmail = "employee@odoo.com";
    const empPasswordPlain = "Employee@1234";
    const hashedEmpPassword = await bcrypt.hash(empPasswordPlain, 10);

    let [empUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, empEmail));

    if (!empUser) {
      [empUser] = await db
        .insert(user)
        .values({
          email: empEmail,
          password: hashedEmpPassword,
          role: "EMPLOYEE",
          firstName: "John",
          lastName: "Doe",
        })
        .returning();
    }

    let [newWeeklySchedule] = await db
      .select()
      .from(workingWeeklySchedule)
      .where(eq(workingWeeklySchedule.name, "Standard Engineering Shift"));

    if (!newWeeklySchedule) {
      [newWeeklySchedule] = await db
        .insert(workingWeeklySchedule)
        .values({
          name: "Standard Engineering Shift",
          workingDays: 5,
          workingHours: 8,
          totalWorkingHours: 40,
        })
        .returning();

      const targetDays = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
      const batchDaysData = targetDays.map((targetDay) => ({
        workingWeeklyScheduleId: newWeeklySchedule.id,
        day: targetDay,
        startTime: "09:00",
        endTime: "17:00",
        breakMinutes: 60,
        dayHours: 8,
      }));

      await db.insert(workingDaySchedule).values(batchDaysData);
    }

    let [regularEmployee] = await db
      .select()
      .from(employee)
      .where(eq(employee.userId, empUser.id));

    if (!regularEmployee) {
      [regularEmployee] = await db
        .insert(employee)
        .values({
          userId: empUser.id,
          employeeId: 1002,
          department: "Engineering",
          designation: "Software Engineer",
          managerId: adminEmployee.id,
          status: "ACTIVE",
          workingWeeklyScheduleId: newWeeklySchedule.id,
        })
        .returning();
    }

    let [existingContract] = await db
      .select()
      .from(contract)
      .where(eq(contract.employeeId, regularEmployee.id));

    if (!existingContract) {
      // Monthly base salary (₹85,000/month), not annual.
      [existingContract] = await db.insert(contract).values({
        employeeId: regularEmployee.id,
        name: "Standard Full-Time Tech Contract",
        startDate: "2026-01-01",
        endDate: "2027-01-01",
        status: "ACTIVE",
        salary: 85000,
        validity: 2027,
      }).returning();
    }

    const defaultTimeoffTypes = [
      {
        name: "Paid Time Off (PTO)",
        unit: "DAY",
        allocationNeed: "REQUIRED",
        status: "ACTIVE",
        displayColour: "BLUE",
      },
      {
        name: "Sick Leave",
        unit: "DAY",
        allocationNeed: "REQUIRED",
        status: "ACTIVE",
        displayColour: "RED",
      },
      {
        name: "Work From Home (WFH)",
        unit: "DAY",
        allocationNeed: "NOT_REQUIRED",
        status: "ACTIVE",
        displayColour: "GREEN",
      },
    ];

    let ptoTypeRecord = null;

    for (const type of defaultTimeoffTypes) {
      let [existing] = await db
        .select()
        .from(timeoffType)
        .where(eq(timeoffType.name, type.name));

      if (!existing) {
        [existing] = await db.insert(timeoffType).values(type).returning();
      }

      if (type.name === "Paid Time Off (PTO)") {
        ptoTypeRecord = existing;
      }
    }

    let [existingAttendance] = await db
      .select()
      .from(attendance)
      .where(eq(attendance.employeeId, regularEmployee.id));

    if (!existingAttendance) {
      await db.insert(attendance).values([
        {
          employeeId: regularEmployee.id,
          date: "2026-09-01",
          checkIn: new Date("2026-09-01T09:00:00Z"),
          checkOut: new Date("2026-09-01T17:00:00Z"),
          workedHours: 8,
          status: "PRESENT",
        },
        {
          employeeId: regularEmployee.id,
          date: "2026-09-02",
          checkIn: new Date("2026-09-02T09:15:00Z"),
          checkOut: new Date("2026-09-02T17:30:00Z"),
          workedHours: 8,
          status: "PRESENT",
        }
      ]);
    }

    let [existingAllocation] = await db
      .select()
      .from(allocation)
      .where(eq(allocation.employeeId, regularEmployee.id));

    if (!existingAllocation) {
      await db.insert(allocation).values({
        employeeId: regularEmployee.id,
        timeoffTypeId: ptoTypeRecord.id,
        allocatedDays: 20,
        takenDays: 0,
        remainingDays: 20,
        validityYear: 2026,
        status: "APPROVED",
        approver: adminUser.id,
      });
    }

    let [existingTimeoff] = await db
      .select()
      .from(timeoff)
      .where(eq(timeoff.employeeId, regularEmployee.id));

    if (!existingTimeoff) {
      await db.insert(timeoff).values({
        employeeId: regularEmployee.id,
        startDate: new Date("2026-10-10T00:00:00Z"),
        endDate: new Date("2026-10-12T00:00:00Z"),
        timeoffType: ptoTypeRecord.id,
        status: "PENDING",
        reason: "Family vacation",
      });
    }

    let [structure] = await db
      .select()
      .from(salaryStructure)
      .where(eq(salaryStructure.name, "Standard Tech Structure"));

    if (!structure) {
      [structure] = await db.insert(salaryStructure).values({
        name: "Standard Tech Structure",
        status: "ACTIVE",
      }).returning();

      // NOTE: for the BASIC rule, computePayrun always overrides this "amount"
      // with the employee's live contract.salary (which is monthly) — this
      // value is kept monthly-scale purely for display/config consistency.
      const [basicRule] = await db.insert(salaryRule).values([
        {
          salaryStructureId: structure.id,
          name: "Basic Salary",
          code: "BASIC",
          category: "BASIC",
          sequence: 10,
          computationMethod: "FIXED",
          amount: 50000,
        },
        {
          salaryStructureId: structure.id,
          name: "House Rent Allowance",
          code: "HRA",
          category: "ALLOWANCE",
          sequence: 20,
          computationMethod: "PERCENTAGE",
          percentage: 40.00,
          percentageBaseCode: "BASIC",
        },
        {
          salaryStructureId: structure.id,
          name: "Performance Bonus",
          code: "BONUS",
          category: "ALLOWANCE",
          sequence: 30,
          computationMethod: "FORMULA",
          formula: "BASIC * 0.10 + 500",
        },
        {
          salaryStructureId: structure.id,
          name: "Provident Fund",
          code: "PF",
          category: "DEDUCTION",
          sequence: 40,
          computationMethod: "PERCENTAGE",
          percentage: 12.00,
          percentageBaseCode: "BASIC",
        }
      ]).returning();

      const [run] = await db.insert(payrun).values({
        name: "September 2026 Payroll",
        periodStart: "2026-09-01",
        periodEnd: "2026-09-30",
        salaryStructureId: structure.id,
        status: "DRAFT",
      }).returning();

      // Monthly-scale demo figures, consistent with the structure above:
      // Basic 50,000 + HRA 20,000 (40%) + Bonus 5,500 (10% + 500) = Gross 75,500
      // PF deduction 6,000 (12% of Basic) => Net 69,500
      const [slip] = await db.insert(payslip).values({
        payrunId: run.id,
        employeeId: regularEmployee.id,
        contractId: existingContract.id,
        basicSalary: 50000,
        grossSalary: 75500,
        netSalary: 69500,
        status: "DRAFT",
      }).returning();

      await db.insert(payslipLine).values([
        {
          payslipId: slip.id,
          salaryRuleId: basicRule.id,
          name: "Basic Salary",
          code: "BASIC",
          category: "BASIC",
          amount: 50000,
          sequence: 10,
        }
      ]);
    }

    const BULK_COUNT = 200;
    const runId = Date.now();
    const bulkPasswordPlain = "Employee@1234";
    const hashedBulkPassword = await bcrypt.hash(bulkPasswordPlain, 10);

    const firstNames = [
      "Aarav", "Priya", "Rohan", "Neha", "Vikram", "Ananya", "Rahul", "Pooja",
      "Amit", "Sneha", "Karan", "Divya", "Aditya", "Kavya", "Manish", "Ritu",
      "Siddharth", "Meera", "Alok", "Tanvi", "Arjun", "Ankit", "Deepak", "Pankaj",
      "Swati", "Nisha", "Kunal", "Pooja", "Varun", "Shreya", "Nikhil", "Akash"
    ];

    const lastNames = [
      "Sharma", "Patel", "Verma", "Gupta", "Singh", "Kumar", "Mehta", "Reddy",
      "Iyer", "Nair", "Joshi", "Chopra", "Deshmukh", "Bose", "Sen", "Malhotra",
      "Saxena", "Bansal", "Rao", "Pillai", "Mishra", "Tiwari", "Pandey", "Choudhary"
    ];

    const departments = [
      { name: "Engineering", designations: ["Software Engineer", "Frontend Developer", "Backend Developer", "DevOps Engineer", "QA Engineer"] },
      { name: "Sales", designations: ["Sales Executive", "Account Manager", "Business Development Lead"] },
      { name: "Marketing", designations: ["Content Writer", "SEO Specialist", "Marketing Manager", "Social Media Lead"] },
      { name: "HR", designations: ["HR Recruiter", "HR Generalist", "People Operations Lead"] },
      { name: "Support", designations: ["Customer Support Executive", "Technical Support Specialist"] },
      { name: "Finance", designations: ["Accountant", "Financial Analyst", "Payroll Specialist"] }
    ];

    const usersToInsert = [];
    const generatedProfiles = [];

    for (let i = 1; i <= BULK_COUNT; i++) {
      const fName = firstNames[(i * 7) % firstNames.length];
      const lName = lastNames[(i * 13) % lastNames.length];
      const deptObj = departments[i % departments.length];
      const designation = deptObj.designations[i % deptObj.designations.length];

      usersToInsert.push({
        email: `${fName.toLowerCase()}.${lName.toLowerCase()}_${i}_${runId}@odoo.com`,
        password: hashedBulkPassword,
        role: "EMPLOYEE",
        firstName: fName,
        lastName: lName,
      });

      generatedProfiles.push({
        department: deptObj.name,
        designation: designation,
      });
    }

    const insertedUsers = await db.insert(user).values(usersToInsert).returning();

    const employeesToInsert = insertedUsers.map((u, index) => ({
      userId: u.id,
      employeeId: 3000 + index,
      department: generatedProfiles[index].department,
      designation: generatedProfiles[index].designation,
      managerId: adminEmployee.id,
      status: "ACTIVE",
      workingWeeklyScheduleId: newWeeklySchedule.id,
    }));

    const insertedEmployees = await db.insert(employee).values(employeesToInsert).returning();

    // Monthly base salaries ranging roughly ₹45,000 – ₹85,000/month,
    // not annual (previously 4,500,000 – 8,500,000).
    const contractsToInsert = insertedEmployees.map((e, index) => ({
      employeeId: e.id,
      name: `Employment Contract - ${e.department}`,
      startDate: "2026-01-01",
      endDate: "2027-01-01",
      status: "ACTIVE",
      salary: 45000 + ((index * 750) % 40000),
      validity: 2027,
    }));

    await db.insert(contract).values(contractsToInsert);

    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

seed();