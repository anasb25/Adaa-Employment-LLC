import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { authApi } from "../services/api/authApi";
import { useAuthStore } from "../store/authStore";
import { LoginRequest, PasswordResetRequest } from "../types/auth";
import { QUERY_KEYS } from "../lib/constants";

export const useAuth = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setAuth, clearAuth, user, isAuthenticated } = useAuthStore();

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginRequest) => authApi.login(credentials),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      toast.success("Welcome back!");
      navigate("/");
    },
    onError: () => {
      // Error is already handled by axios interceptor
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
      toast.success("Logged out successfully");
      navigate("/signin");
    },
    onError: () => {
      // Even if API call fails, clear local state
      clearAuth();
      queryClient.clear();
      navigate("/signin");
    },
  });

  // Password reset mutation
  const resetPasswordMutation = useMutation({
    mutationFn: (data: PasswordResetRequest) => authApi.resetPassword(data),
    onSuccess: (data) => {
      toast.success(data.message || "Password reset successful");
    },
    onError: () => {
      // Error is already handled by axios interceptor
    },
  });

  // Get current user query
  const { data: currentUser, isLoading: isLoadingUser } = useQuery({
    queryKey: QUERY_KEYS.auth.currentUser,
    queryFn: () => authApi.getCurrentUser(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  return {
    // State
    user,
    isAuthenticated,
    currentUser,
    isLoadingUser,

    // Mutations
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    resetPassword: resetPasswordMutation.mutate,

    // Loading states
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isResettingPassword: resetPasswordMutation.isPending,
  };
};
