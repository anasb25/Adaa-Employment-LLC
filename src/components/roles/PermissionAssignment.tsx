import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { rolesApi } from "../../services/api/rolesApi";
import { permissionsApi } from "../../services/api/permissionsApi";
import { Role, Permission } from "../../types/auth";
import { QUERY_KEYS } from "../../lib/constants";
import Button from "../ui/button/Button";
import { getPermissionDisplayName } from "../../utils/permissionUtils";

interface PermissionAssignmentProps {
  role: Role;
  onSuccess?: () => void;
}

export default function PermissionAssignment({
  role,
  onSuccess,
}: PermissionAssignmentProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const queryClient = useQueryClient();

  // Fetch all permissions
  const { data: permissions = [], isLoading: isLoadingPermissions } = useQuery({
    queryKey: ["permissions"],
    queryFn: permissionsApi.getPermissions,
  });

  // Initialize selected permissions when role changes
  useEffect(() => {
    if (role?.permissions) {
      setSelectedPermissions(role.permissions.map((p) => p.id));
    }
  }, [role]);

  const assignPermissionsMutation = useMutation({
    mutationFn: (permissionIds: number[]) =>
      rolesApi.assignPermissions(role.id, permissionIds),
    onSuccess: () => {
      toast.success("Permissions updated successfully!");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.roles.all });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.roles.detail(role.id),
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message ||
          "Failed to update permissions. Please try again."
      );
    },
  });

  const handlePermissionToggle = (permissionId: number) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSelectAll = () => {
    setSelectedPermissions(permissions.map((p) => p.id));
  };

  const handleSelectNone = () => {
    setSelectedPermissions([]);
  };

  const handleSave = () => {
    assignPermissionsMutation.mutate(selectedPermissions);
  };

  const isPermissionSelected = (permissionId: number) =>
    selectedPermissions.includes(permissionId);

  const hasChanges = () => {
    const currentPermissionIds = role?.permissions?.map((p) => p.id) || [];
    return (
      selectedPermissions.length !== currentPermissionIds.length ||
      !selectedPermissions.every((id) => currentPermissionIds.includes(id))
    );
  };

  // Group permissions by resource
  const groupedPermissions = permissions.reduce((acc, permission) => {
    const resource = permission.name.split(":")[0];
    if (!acc[resource]) {
      acc[resource] = [];
    }
    acc[resource].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (isLoadingPermissions) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Assign Permissions to "
          {role.name.charAt(0).toUpperCase() + role.name.slice(1)}"
        </h3>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            className="px-3 py-1 text-sm"
          >
            Select All
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSelectNone}
            className="px-3 py-1 text-sm"
          >
            Select None
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(groupedPermissions).map(
          ([resource, resourcePermissions]) => (
            <div
              key={resource}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <h4 className="font-medium text-gray-900 dark:text-white mb-3 capitalize">
                {resource} Permissions
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {resourcePermissions.map((permission) => (
                  <label
                    key={permission.id}
                    className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <input
                      type="checkbox"
                      checked={isPermissionSelected(permission.id)}
                      onChange={() => handlePermissionToggle(permission.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {getPermissionDisplayName(permission.name)}
                      </div>
                      {permission.description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {permission.description}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )
        )}
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          onClick={handleSave}
          disabled={!hasChanges() || assignPermissionsMutation.isPending}
          className="px-6 py-2"
        >
          {assignPermissionsMutation.isPending
            ? "Saving..."
            : "Save Permissions"}
        </Button>
      </div>
    </div>
  );
}
