import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { employeeService } from "../services/api/employee.service.js";

export const useEmployees = () => {
  return useQuery({
    queryKey: ["employees"],
    queryFn: employeeService.getAll,
  });
};

export const useEmployee = (id) => {
  return useQuery({
    queryKey: ["employee", id],
    queryFn: () => employeeService.getById(id),
    enabled: !!id,
  });
};

export const useMyProfile = () => {
  return useQuery({
    queryKey: ["myProfile"],
    queryFn: employeeService.getMe,
  });
};

export const useEmployeeHubStats = (id) => {
  return useQuery({
    queryKey: ["employeeHubStats", id],
    queryFn: () => employeeService.getHubStats(id),
    enabled: !!id,
  });
};

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: employeeService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
};

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => employeeService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employee", variables.id] });
    },
  });
};

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: employeeService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
};