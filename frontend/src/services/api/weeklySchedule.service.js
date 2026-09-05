import { apiClient } from "./api.js";

export const weeklyScheduleService = {
  create: (data) => apiClient.post("/weekly-schedule/create", data),
  addDay: (data) => apiClient.post("/weekly-schedule/day", data),
  deleteDay: (id) => apiClient.delete(`/weekly-schedule/day/${id}`),
  deleteSchedule: (id) => apiClient.delete(`/weekly-schedule/${id}`),
  getById: (scheduleId) => apiClient.get(`/weekly-schedule/weekly/${scheduleId}`),
  getAll: () => apiClient.get("/weekly-schedule/all"),
  getByEmployee: (employeeId) => apiClient.get(`/weekly-schedule/employee/${employeeId}`),
};