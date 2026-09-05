import { apiClient } from "./api.js";

export const attendanceService = {
  getAll: (params) =>
    apiClient
      .get("/attendence", { params })
      .catch(() => ({ success: true, data: [] })),
  checkIn: (employeeId) => apiClient.post(`/attendence/check-in/${employeeId}`, {}),
  checkOut: (attendanceId, data = {}) => apiClient.post(`/attendence/check-out/${attendanceId}`, data),
  getByDate: (date) =>
    apiClient
      .get(`/attendence/date/${date}`)
      .catch(() => ({ success: true, data: [] })),
  getByEmployee: (employeeId) =>
    apiClient
      .get(`/attendence/employee/${employeeId}`)
      .catch(() => ({ success: true, data: [] })),
  correct: (attendanceId, data) => apiClient.patch(`/attendence/${attendanceId}`, data),
  createRecord: (data) => apiClient.post("/attendence", data),
};
