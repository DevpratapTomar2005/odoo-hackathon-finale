import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { user, employee } from "../db/schema.js";
import { and, eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { db } from "../db/db.js";
import crypto from "crypto";

const createUser = asyncHandler(async (req, res) => {
  const {
    firstname,
    lastname,
    email,
    password,
    role,
    department,
    designation,
    status,
  } = req.body;

  const [userExists] = await db
    .select()
    .from(user)
    .where(eq(user.email, email));

  if (userExists) {
    throw new ApiError(400, "User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await db.transaction(async (tx) => {
    const [newUser] = await tx
      .insert(user)
      .values({
        firstName: firstname,
        lastName: lastname,
        email: email,
        password: hashedPassword,
        role: role,
      })
      .returning({ id: user.id, email: user.email, role: user.role });

    if (!newUser) {
      throw new ApiError(400, "Failed to create user");
    }

    const [newEmployee] = await tx
      .insert(employee)
      .values({
        userId: newUser.id,
        department: department,
        designation: designation,
        status: status,
        employeeId: crypto.randomInt(100000, 999999),
      })
      .returning({
        id: employee.id,
        userId: employee.userId,
        department: employee.department,
        designation: employee.designation,
        status: employee.status,
        employeeId: employee.employeeId,
      });

    if (!newEmployee) {
      throw new ApiError(400, "Failed to create employee");
    }

    return {
      user: newUser,
      employee: newEmployee,
    };
  });

  return res.status(201).json(
    new ApiResponse(201, "User Created Successfully", result),
  );
});

export default {
  createUser,
};