import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { timeoffService } from "../services/api/timeoff.service.js";
import { allocationService } from "../services/api/allocation.service.js";

export const useAllAllocations = () => {
  return useQuery({
    queryKey: ["allocations"],
    queryFn: allocationService.getAll,
  });
};

export const useAllocationsByEmployee = (employeeId) => {
  return useQuery({
    queryKey: ["allocations", "employee", employeeId],
    queryFn: () => allocationService.getByEmployee(employeeId),
    enabled: !!employeeId,
  });
};

export const useCreateAllocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, data }) => allocationService.create(employeeId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["allocations", "employee", variables.employeeId] });
      queryClient.invalidateQueries({ queryKey: ["allocations"] });
      queryClient.invalidateQueries({ queryKey: ["employeeHubStats"] });
    },
  });
};

export const useApproveAllocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: allocationService.approve,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allocations"] });
    },
  });
};

export const useRejectAllocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: allocationService.reject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allocations"] });
    },
  });
};

export const useAllTimeoffRequests = () => {
  return useQuery({
    queryKey: ["timeoffRequests"],
    queryFn: timeoffService.getAllRequests,
  });
};

export const useTimeoffRequestsByEmployee = (employeeId) => {
  return useQuery({
    queryKey: ["timeoffRequests", "employee", employeeId],
    queryFn: () => timeoffService.getByEmployee(employeeId),
    enabled: !!employeeId,
  });
};

export const useCreateTimeoffRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, data }) => timeoffService.createRequest(employeeId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["timeoffRequests", "employee", variables.employeeId] });
      queryClient.invalidateQueries({ queryKey: ["timeoffRequests"] });
      queryClient.invalidateQueries({ queryKey: ["employeeHubStats"] });
      queryClient.invalidateQueries({ queryKey: ["allocations"] });
    },
  });
};

export const useApproveTimeoff = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: timeoffService.approveRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeoffRequests"] });
      queryClient.invalidateQueries({ queryKey: ["allocations"] });
    },
  });
};

export const useRejectTimeoff = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: timeoffService.rejectRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeoffRequests"] });
    },
  });
};

export const useTimeoffTypes = () => {
  return useQuery({
    queryKey: ["timeoffTypes"],
    queryFn: timeoffService.getTypes,
  });
};

export const useCreateTimeoffType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: timeoffService.createType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeoffTypes"] });
    },
  });
};

export const useEditTimeoffType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => timeoffService.editType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeoffTypes"] });
    },
  });
};