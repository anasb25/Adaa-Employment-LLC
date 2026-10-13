import { Permission } from "../types/auth";
import { isSuperAdminRole } from "./superAdmin";

type PermissionHolder = {
  role?: { name?: string | null; permissions?: Permission[] | null } | null;
};

/** Admin menu (User / Role / Permission management) — never granted by global:all alone. */
const ADMIN_MENU_RESOURCES = new Set(["user", "role", "permission"]);

/** Match backend: role permissions control access; global:all skips Admin menu only. */
export function getRolePermissions(
  user?: PermissionHolder | null,
): Permission[] {
  return user?.role?.permissions ?? [];
}

export function checkPermission(
  user: PermissionHolder | null | undefined,
  permission: string,
): boolean {
  if (isSuperAdminRole(user?.role)) {
    return true;
  }

  const names = getRolePermissions(user).map((p) => p.name);
  if (!names.length) return false;

  if (names.includes(permission)) {
    return true;
  }

  const resource = permission.split(":")[0] || "";

  if (resource && names.includes(`${resource}:all`)) {
    return true;
  }

  if (
    names.includes("global:all") &&
    resource &&
    !ADMIN_MENU_RESOURCES.has(resource)
  ) {
    return true;
  }

  return false;
}
