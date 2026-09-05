import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "../services/api/auth.service.js";
import { useNavigate } from "react-router";

export const useLogin = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      queryClient.setQueryData(["authUser"], data.data.user);
      navigate("/");
    },
    onError: (error) => {
      console.error("Login failed:", error.message);
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      queryClient.clear();
      navigate("/login");
    },
    onError: (error) => {
      console.error("Logout failed:", error.message);
    },
  });
};

export const useRefreshToken = () => {
  return useMutation({
    mutationFn: authService.refreshToken,
  });
};