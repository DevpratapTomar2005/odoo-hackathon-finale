import z from "zod";

export const createUserSchema = z.object({
  firstname: z.string().max(50).toLowerCase(),
  lastname: z.string().max(50).toLowerCase(),
  email: z.string().email("Invalid email address").trim().toLowerCase(),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .max(20, { message: "Password cannot exceed 20 characters" })
    .refine((val) => /[A-Z]/.test(val), {
      message: "Password must contain at least one uppercase letter",
    })
    .refine((val) => /[a-z]/.test(val), {
      message: "Password must contain at least one lowercase letter",
    })
    .refine((val) => /[0-9]/.test(val), {
      message: "Password must contain at least one number",
    })
    .refine((val) => /[^A-Za-z0-9]/.test(val), {
      message: "Password must contain at least one special character",
    }),
  role: z.enum(["HR_MANAGER", "ADMIN", "EMPLOYEE", "HR_PAYROLL", "PAYROLL_ADMIN"],
  {message:"Invalid role"}),
  department: z.string().max(200).toLowerCase(),
  designation: z.string().max(200).toLowerCase(),
  status: z.enum(["ACTIVE", "RESIGNED", "TERMINATED"], {message:"Invalid status"}),
});
    