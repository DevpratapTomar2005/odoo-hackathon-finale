import { apiClient } from "./api.js";

export const salaryRuleService = {
  create: (salaryStructureId, data) => apiClient.post(`/salary-rule/structure/${salaryStructureId}`, data),
  edit: (salaryRuleId, data) => apiClient.patch(`/salary-rule/${salaryRuleId}`, data),
  getByStructure: (salaryStructureId) => apiClient.get(`/salary-rule/structure/${salaryStructureId}`),
  getById: (salaryRuleId) => apiClient.get(`/salary-rule/${salaryRuleId}`),
};