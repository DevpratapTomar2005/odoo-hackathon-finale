import { db, connectDB } from "./db.js";
import {
  user,
  employee,
  timeoffType,
  contract,
  workingWeeklySchedule,
  workingDaySchedule,
} from "./schema.js";
import bcrypt from "bcrypt";
import { eq, and } from "drizzle-orm";

const seed = async () => {
  try {
    console.log("🌱 Starting Database Seeding...\n");
    await connectDB();

    console.log("\n👤 Checking / Creating Admin user...");
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
      console.log(`  ✅ Admin user created: ${adminUser.email}`);
    } else {
      console.log(`  ℹ️ Admin user already exists: ${adminUser.email}`);
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
      console.log(
        `  ✅ Admin employee profile created (Emp ID: ${adminEmployee.employeeId})`,
      );
    } else {
      console.log(`  ℹ️ Admin employee profile already exists.`);
    }

    console.log("\n👤 Checking / Creating Regular Employee user...");
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
      console.log(`  ✅ Regular employee user created: ${empUser.email}`);
    } else {
      console.log(
        `  ℹ️ Regular employee user already exists: ${empUser.email}`,
      );
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
      console.log("  ✅ Weekly schedule and daily shift mappings created successfully.");
    } else {
      console.log("  ℹ️ Weekly schedule configuration already exists.");
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

      console.log(
        `  ✅ Regular employee profile created (Emp ID: ${regularEmployee.employeeId})`,
      );
    } else {
      console.log(`  ℹ️ Regular employee profile already exists.`);
    }

    const [existingContract] = await db
      .select()
      .from(contract)
      .where(eq(contract.employeeId, regularEmployee.id));

    if (!existingContract) {
      await db.insert(contract).values({
        employeeId: regularEmployee.id,
        name: "Standard Full-Time Tech Contract",
        startDate: "2026-01-01",
        endDate: "2027-01-01",
        status: "ACTIVE",
        salary: 8500000,
        validity: 2027,
      });
      console.log("  ✅ Employee contract document attached.");
    } else {
      console.log("  ℹ️ Employee contract row already exists.");
    }

    console.log("\n🏖️ Checking / Creating Time-off Types...");
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

    for (const type of defaultTimeoffTypes) {
      const [existing] = await db
        .select()
        .from(timeoffType)
        .where(eq(timeoffType.name, type.name));

      if (!existing) {
        await db.insert(timeoffType).values(type);
        console.log(`  ✅ Created Time-off Type: ${type.name}`);
      } else {
        console.log(`  ℹ️ Time-off Type already exists: ${type.name}`);
      }
    }

    console.log("\n✨ Database Seeding Completed Successfully!");
    console.log("================================================");
    console.log("🔑 Test Credentials for Routes:");
    console.log("------------------------------------------------");
    console.log("👑 ADMIN:");
    console.log(`   Email:    ${adminEmail}`);
    console.log(`   Password: ${adminPasswordPlain}`);
    console.log("------------------------------------------------");
    console.log("👤 EMPLOYEE:");
    console.log(`   Email:    ${empEmail}`);
    console.log(`   Password: ${empPasswordPlain}`);
    console.log("================================================\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

seed();
