import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { attendanceService } from "../services/api/attendence.service.js";

export const useAllAttendance = () => {
  return useQuery({
    queryKey: ["attendance"],
    queryFn: attendanceService.getAll,
  });
};

export const useAttendanceByDate = (date) => {
  return useQuery({
    queryKey: ["attendance", "date", date],
    queryFn: () => attendanceService.getByDate(date),
    enabled: !!date,
  });
};

export const useAttendanceByEmployee = (employeeId) => {
  return useQuery({
    queryKey: ["attendance", "employee", employeeId],
    queryFn: () => attendanceService.getByEmployee(employeeId),
    enabled: !!employeeId,
  });
};

export const useCheckIn = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (employeeId) => attendanceService.checkIn(employeeId),
    onSuccess: (_, employeeId) => {
      queryClient.invalidateQueries({ queryKey: ["attendance", "employee", employeeId] });
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
    },
  });
};

export const useCheckOut = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ attendanceId, data }) => attendanceService.checkOut(attendanceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
    },
  });
};

export const useAttendanceCorrection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => attendanceService.correct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
};

export const useCreateAttendanceRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => attendanceService.createRecord(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
};