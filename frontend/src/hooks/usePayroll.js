import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { payrollService } from "../services/api/payroll.service.js";
import { salaryStructureService } from "../services/api/salaryStructure.service.js";
import { salaryRuleService } from "../services/api/salaryRule.service.js";

export const usePayrollDashboard = (filters) => {
  return useQuery({
    queryKey: ["payrollDashboard", filters],
    queryFn: () => payrollService.getDashboard(filters),
  });
};

export const usePayruns = () => {
  return useQuery({
    queryKey: ["payruns"],
    queryFn: payrollService.getAllPayruns,
  });
};

export const usePayrun = (id) => {
  return useQuery({
    queryKey: ["payrun", id],
    queryFn: () => payrollService.getPayrunById(id),
    enabled: !!id,
  });
};

export const useAllPayslips = () => {
  return useQuery({
    queryKey: ["payslips"],
    queryFn: payrollService.getAllPayslips,
  });
};

export const usePayslipsByEmployee = (employeeId) => {
  return useQuery({
    queryKey: ["payslips", "employee", employeeId],
    queryFn: () => payrollService.getPayslipsByEmployee(employeeId),
    enabled: !!employeeId,
  });
};

export const usePayslip = (id) => {
  return useQuery({
    queryKey: ["payslip", id],
    queryFn: () => payrollService.getPayslipById(id),
    enabled: !!id,
  });
};

export const useCreatePayrun = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: payrollService.createPayrun,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payruns"] });
    },
  });
};

export const useComputePayrun = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => payrollService.computePayrun(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["payruns"] });
      queryClient.invalidateQueries({ queryKey: ["payrun", id] });
      queryClient.invalidateQueries({ queryKey: ["payslips"] });
    },
  });
};

export const useValidatePayrun = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => payrollService.validatePayrun(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["payruns"] });
      queryClient.invalidateQueries({ queryKey: ["payrun", id] });
      queryClient.invalidateQueries({ queryKey: ["payslips"] });
    },
  });
};

export const useMarkPaidPayrun = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => payrollService.markPaid(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["payruns"] });
      queryClient.invalidateQueries({ queryKey: ["payrun", id] });
      queryClient.invalidateQueries({ queryKey: ["payslips"] });
    },
  });
};

export const useSendPayslips = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => payrollService.sendPayslips(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["payrun", id] });
    },
  });
};

export const useSalaryStructures = () => {
  return useQuery({
    queryKey: ["salaryStructures"],
    queryFn: salaryStructureService.getAll,
  });
};

export const useSalaryStructure = (id) => {
  return useQuery({
    queryKey: ["salaryStructure", id],
    queryFn: () => salaryStructureService.getById(id),
    enabled: !!id,
  });
};

export const useCreateSalaryStructure = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: salaryStructureService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salaryStructures"] });
    },
  });
};

export const useSalaryRulesByStructure = (structureId) => {
  return useQuery({
    queryKey: ["salaryRules", structureId],
    queryFn: () => salaryRuleService.getByStructure(structureId),
    enabled: !!structureId,
  });
};

export const useCreateSalaryRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ structureId, data }) => salaryRuleService.create(structureId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["salaryRules", variables.structureId] });
    },
  });
};