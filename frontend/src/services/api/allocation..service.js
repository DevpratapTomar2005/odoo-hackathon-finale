import { apiClient } from "./api.js";

export const allocationService = {
  getAll: async () => {
    return await apiClient.get("/allocation/all");
  },
  getByEmployee: async (employeeId) => {
    return await apiClient.get(`/allocation/${employeeId}/all`);
  },
  create: async (employeeId, data) => {
    return await apiClient.post(`/allocation/${employeeId}/create`, data);
  },
  update: async (allocationId, data) => {
    return await apiClient.put(`/allocation/${allocationId}`, data);
  },
  approve: async (allocationId) => {
    return await apiClient.patch(`/allocation/${allocationId}/approve`);
  },
  reject: async (allocationId) => {
    return await apiClient.patch(`/allocation/${allocationId}/reject`);
  },
};