import { db, connectDB } from "./db.js";
import {
  user,
  employee,
  timeoffType,
  contract,
  workingSchedule,
} from "./schema.js";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

const seed = async () => {
  try {
    console.log("🌱 Starting Database Seeding...\n");
    await connectDB();

    
   

    // 2. Create Admin User (satisfies password validation: Admin@1234)
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

    // 3. Create Admin Employee Profile
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
    }

    // 4. Create a Standard Test Employee
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

    // 5. Create Employee Profile with Admin as Manager
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
        })
        .returning();
      console.log(
        `  ✅ Regular employee profile created (Emp ID: ${regularEmployee.employeeId})`,
      );

      // Add a sample contract (Salary in cents: 85,000.00 -> 8500000)
      await db.insert(contract).values({
        employeeId: regularEmployee.id,
        startDate: "2026-01-01",
        endDate: "2027-01-01",
        status: "ACTIVE",
        salary: 8500000,
      });

      // Add working schedule
      await db.insert(workingSchedule).values({
        employeeId: regularEmployee.id,
        workingDays: 5,
        workingHours: 8,
        totalWorkingHours: 40,
      });
      console.log("  ✅ Contract and working schedule attached.");
    }

    // 6. Create Default Time-off Types
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
