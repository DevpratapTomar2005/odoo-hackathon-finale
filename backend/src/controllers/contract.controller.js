import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { employee, contract } from "../db/schema.js"; 
import { eq, desc } from "drizzle-orm";
import { db } from "../db/db.js";

const createContract = asyncHandler(async (req, res) => {
  const { name, startDate, endDate, salary, status, employeeId, validity } = req.body;

  const [existingEmployee] = await db
    .select()
    .from(employee)
    .where(eq(employee.id, employeeId));

  if (!existingEmployee) {
    throw new ApiError(404, "Employee does not exist");
  }

  const [newContract] = await db
    .insert(contract)
    .values({
      name,
      startDate,
      endDate: endDate??null,
      salary,
      status,
      validity,
      employeeId: existingEmployee.id,
    })
    .returning();

  if (!newContract) {
    throw new ApiError(400, "Failed to create contract");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, "Contract created successfully", newContract));
});

const getAllContracts = asyncHandler(async (req, res) => {
  const allContracts = await db.select().from(contract).orderBy(desc(contract.createdAt));

  return res
    .status(200)
    .json(new ApiResponse(200, "All contracts fetched successfully", allContracts));
});

const getContractById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [contractRecord] = await db
    .select()
    .from(contract)
    .where(eq(contract.id, id));

  if (!contractRecord) {
    throw new ApiError(404, "Contract not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Contract fetched successfully", contractRecord));
});

const updateContract = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, startDate, endDate, salary, status, validity } = req.body;


  const [contractRecord] = await db
    .select()
    .from(contract)
    .where(eq(contract.id, id));

  if (!contractRecord) {
    throw new ApiError(404, "Contract not found");
  }

  
  const updateObj = {};
  if (name !== undefined) updateObj.name = name;
  if (startDate !== undefined) updateObj.startDate = startDate;
  if (endDate !== undefined) updateObj.endDate = endDate;
  if (salary !== undefined) updateObj.salary = salary;
  if (status !== undefined) updateObj.status = status;
  if (validity !== undefined) updateObj.validity = validity;

  const [updatedContract] = await db
    .update(contract)
    .set(updateObj)
    .where(eq(contract.id, id))
    .returning();

  if (!updatedContract) {
    throw new ApiError(400, "Failed to update contract");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Contract updated successfully", updatedContract));
});

export default {
  createContract,
  getAllContracts,
  getContractById,
  updateContract,
};
