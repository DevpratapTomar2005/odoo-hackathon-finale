import { apiClient } from "./api.js";

export const attendanceService = {
  checkIn: async (employeeId, data) => {
    return await apiClient.post(`/attendence/check-in/${employeeId}`, data);
  },
  checkOut: async (attendanceId, data) => {
    return await apiClient.post(`/attendence/check-out/${attendanceId}`, data);
  },
  getByDate: async (date) => {
    return await apiClient.get(`/attendence/date/${date}`);
  },
  getByEmployee: async (employeeId) => {
    return await apiClient.get(`/attendence/employee/${employeeId}`);
  },
};