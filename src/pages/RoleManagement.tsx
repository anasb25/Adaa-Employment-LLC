import { useState } from "react";
import { Role } from "../types/auth";
import RoleForm from "../components/roles/RoleForm";
import RoleList from "../components/roles/RoleList";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import PermissionGuard from "../components/auth/PermissionGuard";

export default function RoleManagementPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const handleCreateRole = () => {
    setEditingRole(null);
    setShowCreateForm(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setShowCreateForm(true);
  };

  const handleFormSuccess = () => {
    setShowCreateForm(false);
    setEditingRole(null);
  };

  const handleFormCancel = () => {
    setShowCreateForm(false);
    setEditingRole(null);
  };

  return (
    <>
      <PageMeta
        title="Role Management | ADAA Employment LLC"
        description="Manage user roles and permissions for ADAA Employment LLC"
      />
      <PermissionGuard
        permission="role:read"
        fallback={
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Access Denied
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                You don't have permission to access role management.
              </p>
            </div>
          </div>
        }
      >
        <PageBreadcrumb pageTitle="Role Management" />

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <div className="space-y-6">
            {/* Create/Edit Role Form */}
            {showCreateForm && (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {editingRole ? "Edit Role" : "Create New Role"}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {editingRole
                      ? "Update the role details below"
                      : "Fill in the details to create a new role"}
                  </p>
                </div>

                <RoleForm
                  role={editingRole || undefined}
                  onSuccess={handleFormSuccess}
                  onCancel={handleFormCancel}
                />
              </div>
            )}

            {/* Roles List */}
            {!showCreateForm && (
              <RoleList
                onCreateRole={handleCreateRole}
                onEditRole={handleEditRole}
              />
            )}
          </div>
        </div>
      </PermissionGuard>
    </>
  );
}
