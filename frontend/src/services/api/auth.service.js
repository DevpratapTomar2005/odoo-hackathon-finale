import { apiClient } from "./api.js";

export const authService = {
  login: (data) => apiClient.post("/auth/login", data),
  logout: () => apiClient.post("/auth/logout", {}),
  refreshToken: () => apiClient.post("/auth/refresh-token", {}),
};