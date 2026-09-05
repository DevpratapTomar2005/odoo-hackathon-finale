import { apiClient } from "./api.js";

export const contractService = {
  getAll: (params) => apiClient.get("/contract/all", { params }),
  getById: (id) => apiClient.get(`/contract/${id}`),
  create: (data) => apiClient.post("/contract/create", data),
  update: (id, data) => apiClient.put(`/contract/${id}`, data),
};