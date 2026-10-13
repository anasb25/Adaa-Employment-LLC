import React from "react";
import { usePermissions } from "../../hooks/usePermissions";

interface PermissionGuardProps {
  permission?: string;
  permissions?: string[];
  role?: string;
  roles?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  permissions,
  role,
  roles,
  requireAll = false,
  fallback = null,
  children,
}) => {
  const {
    hasPermission,
    hasRole,
    hasAnyRole,
    hasAllPermissions,
    hasAnyPermission,
  } = usePermissions();

  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  if (permissions && permissions.length > 0) {
    const hasRequiredPermissions = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);

    if (!hasRequiredPermissions) {
      return <>{fallback}</>;
    }
  }

  if (role && !hasRole(role)) {
    return <>{fallback}</>;
  }

  if (roles && roles.length > 0 && !hasAnyRole(roles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default PermissionGuard;
