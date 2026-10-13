import { useAuth } from "./useAuth";
import { checkPermission, getRolePermissions } from "../utils/permissionCheck";

export const usePermissions = () => {
  const { user } = useAuth();

  const permissionRecords = getRolePermissions(user);

  const hasPermission = (permission: string): boolean =>
    checkPermission(user, permission);

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
    return permissionRecords.map((p) => p.name);
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
    userPermissions: permissionRecords,
  };
};
