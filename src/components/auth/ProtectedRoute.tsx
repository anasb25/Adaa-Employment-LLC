import { Navigate, useLocation } from "react-router";
import { useAuthStore } from "../../store/authStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to signin page but save the attempted location
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
