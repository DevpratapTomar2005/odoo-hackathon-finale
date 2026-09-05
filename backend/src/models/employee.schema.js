import z from "zod";

export const getEmployeeByIdSchema = z.object({
  params: z.object({
    id: z.uuid("Invalid employee ID format"),
  }),
});

export const updateEmployeeSchema = z.object({
  params: z.object({
    id: z.uuid("Invalid employee ID format"),
  }),
  body: z.object({
    department: z
      .string()
      .max(200, "Department name cannot exceed 200 characters")
      .optional(),
    designation: z
      .string()
      .max(200, "Designation name cannot exceed 200 characters")
      .optional(),
    managerId: z.string().uuid("Invalid manager ID format").optional(),
    status: z
      .enum(["ACTIVE", "RESIGNED", "TERMINATED"], {
        errorMap: () => ({
          message: "Status must be ACTIVE, RESIGNED, or TERMINATED",
        }),
      })
      .optional(),
    workingWeeklyScheduleId: z
      .string()
      .uuid("Invalid schedule ID format")
      .optional(),
  }),
});
