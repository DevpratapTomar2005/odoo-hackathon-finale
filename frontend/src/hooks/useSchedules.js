import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { weeklyScheduleService } from "../services/api/weeklySchedule.service.js";

export const useWeeklySchedules = () => {
  return useQuery({
    queryKey: ["weeklySchedules"],
    queryFn: weeklyScheduleService.getAll,
  });
};

export const useCreateWeeklySchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: weeklyScheduleService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weeklySchedules"] });
    },
  });
};

export const useDeleteWeeklySchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: weeklyScheduleService.deleteSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weeklySchedules"] });
    },
  });
};
