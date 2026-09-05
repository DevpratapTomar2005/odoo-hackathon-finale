import { apiClient } from "./api.js";

export const employeeService = {
  getMe: () => apiClient.get("/employee/me"),
  getAll: () => apiClient.get("/employee"),
  getById: (id) => apiClient.get(`/employee/${id}`),
  update: (id, data) => apiClient.patch(`/employee/${id}`, data),
  create: (data) => apiClient.post("/user/create", data),
  getHubStats: (id) => apiClient.get(`/employee/${id}/hub-stats`),
};