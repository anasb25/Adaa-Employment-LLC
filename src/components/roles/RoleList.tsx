import React, { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { rolesApi } from "../../services/api/rolesApi";
import { Role } from "../../types/auth";
import { QUERY_KEYS } from "../../lib/constants";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import RoleForm from "./RoleForm";
import PermissionAssignment from "./PermissionAssignment";
import PermissionGuard from "../auth/PermissionGuard";
import { Modal } from "../ui/ReusableModal";
import { AlertIcon as SearchIcon, PlusIcon } from "../../icons";
import { useSearch } from "../../hooks/useDebounce";

interface RoleListProps {
  onCreateRole: () => void;
  onEditRole: (role: Role) => void;
}

export default function RoleList({ onCreateRole, onEditRole }: RoleListProps) {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showPermissionAssignment, setShowPermissionAssignment] =
    useState(false);
  const queryClient = useQueryClient();

  // Search hook
  const { searchValue, debouncedSearchValue, handleSearchChange, clearSearch } =
    useSearch("");

  // Fetch all roles
  const {
    data: roles = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.roles.all,
    queryFn: rolesApi.getRoles,
  });

  // Filter roles based on search
  const filteredRoles = useMemo(() => {
    if (!debouncedSearchValue) return roles;

    const searchLower = debouncedSearchValue.toLowerCase();
    return roles.filter((role: Role) => {
      return (
        role.name?.toLowerCase().includes(searchLower) ||
        role.description?.toLowerCase().includes(searchLower)
      );
    });
  }, [roles, debouncedSearchValue]);

  const deleteRoleMutation = useMutation({
    mutationFn: (id: number) => rolesApi.deleteRole(id),
    onSuccess: () => {
      toast.success("Role deleted successfully!");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.roles.all });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message ||
          "Failed to delete role. Please try again."
      );
    },
  });

  const handleDeleteRole = (role: Role) => {
    if (
      window.confirm(
        `Are you sure you want to delete the "${role.name}" role? This action cannot be undone.`
      )
    ) {
      deleteRoleMutation.mutate(role.id);
    }
  };

  const handleManagePermissions = (role: Role) => {
    setSelectedRole(role);
    setShowPermissionAssignment(true);
  };

  const handleClosePermissionAssignment = () => {
    setSelectedRole(null);
    setShowPermissionAssignment(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400 mb-4">
          Failed to load roles
        </p>
        <Button onClick={() => refetch()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (roles.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header with Search Bar and Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 w-full sm:w-auto">
            <div className="relative flex-1 max-w-md">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search roles by name or description..."
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            {searchValue && (
              <Button onClick={clearSearch} variant="outline" size="sm">
                Clear
              </Button>
            )}
          </div>

          <PermissionGuard permission="role:create">
            <Button onClick={onCreateRole} startIcon={<PlusIcon />}>
              Create Role
            </Button>
          </PermissionGuard>
        </div>

        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No roles found
          </p>
          <Button onClick={onCreateRole}>Create First Role</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search Bar and Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search roles by name or description..."
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          {searchValue && (
            <Button onClick={clearSearch} variant="outline" size="sm">
              Clear
            </Button>
          )}
        </div>

        <PermissionGuard permission="role:create">
          <Button onClick={onCreateRole} startIcon={<PlusIcon />}>
            Create Role
          </Button>
        </PermissionGuard>
      </div>

      {filteredRoles.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No roles found matching "{searchValue}"
          </p>
          <Button onClick={clearSearch} variant="outline">
            Clear Search
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRoles.map((role) => (
            <div
              key={role.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                    </h3>
                  </div>

                  {role.description && (
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                      {role.description}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <PermissionGuard permission="role:assign-permissions">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleManagePermissions(role)}
                      className="px-3 py-1"
                    >
                      Manage Permissions
                    </Button>
                  </PermissionGuard>
                  <PermissionGuard permission="role:update">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditRole(role)}
                      className="px-3 py-1"
                    >
                      Edit
                    </Button>
                  </PermissionGuard>
                  <PermissionGuard permission="role:delete">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteRole(role)}
                      disabled={deleteRoleMutation.isPending}
                      className="px-3 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                    >
                      {deleteRoleMutation.isPending ? "Deleting..." : "Delete"}
                    </Button>
                  </PermissionGuard>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Permission Assignment Modal */}
      {showPermissionAssignment && selectedRole && (
        <Modal
          isOpen={showPermissionAssignment}
          onClose={handleClosePermissionAssignment}
          title={`Manage Permissions - ${
            selectedRole.name.charAt(0).toUpperCase() +
            selectedRole.name.slice(1)
          }`}
          size="xl"
        >
          <div className="p-6">
            <PermissionAssignment
              role={selectedRole}
              onSuccess={handleClosePermissionAssignment}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
