import { apiClient } from "./api.js";

export const salaryStructureService = {
  create: (data) => apiClient.post("/salary-structure", data),
  getAll: () => apiClient.get("/salary-structure"),
  getById: (id) => apiClient.get(`/salary-structure/${id}`),
  update: (id, data) => apiClient.patch(`/salary-structure/${id}`, data),
};