import { apiClient } from "./api.js";

export const attendanceService = {
  getAll: (params) => apiClient.get("/attendence", { params }),
  checkIn: (employeeId, data = {}) => apiClient.post(`/attendence/check-in/${employeeId}`, data),
  checkOut: (attendanceId, data = {}) => apiClient.post(`/attendence/check-out/${attendanceId}`, data),
  getByDate: (date) => apiClient.get(`/attendence/date/${date}`),
  getByEmployee: (employeeId) => apiClient.get(`/attendence/employee/${employeeId}`),
  correct: (attendanceId, data) => apiClient.patch(`/attendence/${attendanceId}`, data),
  createRecord: (data) => apiClient.post("/attendence", data),
};
