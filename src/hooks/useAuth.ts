import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router";
import { toast } from "sonner";
import { authApi } from "../services/api/authApi";
import { useAuthStore } from "../store/authStore";
import {
  LoginRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from "../types/auth";
import { QUERY_KEYS } from "../lib/constants";

export const useAuth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { setAuth, clearAuth, user, isAuthenticated } = useAuthStore();

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginRequest) => authApi.login(credentials),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      toast.success("Welcome back!");
      // Redirect to the original location or dashboard
      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    },
    onError: () => {
      // Error is already handled by axios interceptor
    },
  });

  // Logout function - stateless, just clear local state
  const logout = () => {
    clearAuth();
    queryClient.clear();
    toast.success("Logged out successfully");
    navigate("/signin");
  };

  // Forgot password mutation
  const forgotPasswordMutation = useMutation({
    mutationFn: (data: ForgotPasswordRequest) => authApi.forgotPassword(data),
    onSuccess: (data) => {
      toast.success(data.message || "Password reset link sent to your email");
    },
    onError: () => {
      // Error is already handled by axios interceptor
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: (data: ResetPasswordRequest) => authApi.resetPassword(data),
    onSuccess: (data) => {
      toast.success(data.message || "Password reset successful");
      navigate("/signin");
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
    logout,
    forgotPassword: forgotPasswordMutation.mutate,
    resetPassword: resetPasswordMutation.mutate,

    // Loading states
    isLoggingIn: loginMutation.isPending,
    isForgotPasswordLoading: forgotPasswordMutation.isPending,
    isResettingPassword: resetPasswordMutation.isPending,
  };
};
