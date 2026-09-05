import { apiClient } from "./api.js";

export const userService = {
  create: (data) => apiClient.post("/user/create", data),
};