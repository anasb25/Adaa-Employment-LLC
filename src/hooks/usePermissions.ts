import { useAuth } from "./useAuth";

export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = (permission: string): boolean => {
    if (!user?.role?.permissions) return false;

    const userPermissions = user.role.permissions.map((p) => p.name);

    // Check for exact match
    if (userPermissions.includes(permission)) {
      return true;
    }

    // Check for wildcard permissions
    const permissionParts = permission.split(":");
    if (permissionParts.length >= 2) {
      const resource = permissionParts[0];

      // Check for resource:all permission
      if (userPermissions.includes(`${resource}:all`)) {
        return true;
      }

      // Check for global:all permission
      if (userPermissions.includes("global:all")) {
        return true;
      }
    }

    return false;
  };

  const hasRole = (roleName: string): boolean => {
    return user?.role?.name === roleName;
  };

  const hasAnyRole = (roleNames: string[]): boolean => {
    return roleNames.includes(user?.role?.name || "");
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every((permission) => hasPermission(permission));
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some((permission) => hasPermission(permission));
  };

  const getUserPermissions = (): string[] => {
    return user?.role?.permissions?.map((p) => p.name) || [];
  };

  const getUserRole = (): string | null => {
    return user?.role?.name || null;
  };

  return {
    hasPermission,
    hasRole,
    hasAnyRole,
    hasAllPermissions,
    hasAnyPermission,
    getUserPermissions,
    getUserRole,
    userRole: user?.role,
    userPermissions: user?.role?.permissions || [],
  };
};
