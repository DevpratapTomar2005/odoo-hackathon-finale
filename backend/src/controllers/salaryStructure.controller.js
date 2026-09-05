import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { salaryStructure } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { db } from "../db/db.js";

const createSalaryStructure = asyncHandler(async (req, res) => {
  const { name, status } = req.body;

  const [newStructure] = await db
    .insert(salaryStructure)
    .values({ name, status })
    .returning();

  if (!newStructure) {
    throw new ApiError(400, "Failed to create salary structure");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        "Salary structure created successfully",
        newStructure,
      ),
    );
});

const editSalaryStructure = asyncHandler(async (req, res) => {
  const { salaryStructureId } = req.params;
  const { name, status } = req.body;

  const [existingStructure] = await db
    .select()
    .from(salaryStructure)
    .where(eq(salaryStructure.id, salaryStructureId));

  if (!existingStructure) {
    throw new ApiError(404, "Salary structure not found");
  }

  const updateObj = {};

  if (name) {
    updateObj.name = name;
  }

  if (status) {
    updateObj.status = status;
  }

  const [updatedStructure] = await db
    .update(salaryStructure)
    .set(updateObj)
    .where(eq(salaryStructure.id, salaryStructureId))
    .returning();

  if (!updatedStructure) {
    throw new ApiError(400, "Failed to edit salary structure");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Salary structure edited successfully",
        updatedStructure,
      ),
    );
});

const getAllSalaryStructures = asyncHandler(async (req, res) => {
  const allStructures = await db.select().from(salaryStructure);

  if (allStructures.length === 0) {
    throw new ApiError(404, "No salary structures found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Salary structures fetched successfully",
        allStructures,
      ),
    );
});

const getSalaryStructureById = asyncHandler(async (req, res) => {
  const { salaryStructureId } = req.params;

  const [existingStructure] = await db
    .select()
    .from(salaryStructure)
    .where(eq(salaryStructure.id, salaryStructureId));

  if (!existingStructure) {
    throw new ApiError(404, "Salary structure not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Salary structure fetched successfully",
        existingStructure,
      ),
    );
});

export default {
  createSalaryStructure,
  editSalaryStructure,
  getAllSalaryStructures,
  getSalaryStructureById,
};
