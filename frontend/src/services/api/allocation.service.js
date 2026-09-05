import { apiClient } from "./api.js";

export const allocationService = {
  create: (employeeId, data) => apiClient.post(`/allocation/${employeeId}/create`, data),
  getByEmployee: (employeeId) =>
    apiClient
      .get(`/allocation/${employeeId}/all`)
      .catch(() => ({ success: true, data: [] })),
  getAll: (params) =>
    apiClient
      .get("/allocation/all", { params })
      .catch(() => ({ success: true, data: [] })),
  edit: (allocationId, data) => apiClient.put(`/allocation/${allocationId}`, data),
  approve: (allocationId) => apiClient.patch(`/allocation/${allocationId}/approve`, {}),
  reject: (allocationId) => apiClient.patch(`/allocation/${allocationId}/reject`, {}),
};
