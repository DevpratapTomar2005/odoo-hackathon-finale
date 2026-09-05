import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { contractService } from "../services/api/contract.service.js";

export const useContracts = (filters) => {
  return useQuery({
    queryKey: ["contracts", filters],
    queryFn: () => contractService.getAll(filters),
  });
};

export const useContract = (id) => {
  return useQuery({
    queryKey: ["contract", id],
    queryFn: () => contractService.getById(id),
    enabled: !!id,
  });
};

export const useCreateContract = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: contractService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["employeeHubStats"] });
    },
  });
};

export const useUpdateContract = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => contractService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["contract", variables.id] });
    },
  });
};