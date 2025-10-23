import { Navigate, useLocation } from "react-router";
import { useAuthStore } from "../../store/authStore";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (isAuthenticated) {
    // If user is already authenticated, redirect to dashboard
    // Check if there's a redirect location from the previous page
    const from = location.state?.from?.pathname || "/";
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
}
