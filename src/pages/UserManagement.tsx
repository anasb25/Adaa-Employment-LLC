import { useQuery } from "@tanstack/react-query";
import { usersApi } from "../services/api/usersApi.ts";
import { QUERY_KEYS } from "../lib/constants";
import UserList from "../components/users/UserList";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import PermissionGuard from "../components/auth/PermissionGuard";

export default function UserManagementPage() {
  const { data: usersData } = useQuery({
    queryKey: [QUERY_KEYS.users.all, 1, 10],
    queryFn: () => usersApi.getUsers(1, 10),
  });

  return (
    <>
      <PageMeta
        title="User Management | ADAA Employment LLC"
        description="Manage users and their status for ADAA Employment LLC"
      />
      <PermissionGuard
        permission="user:read"
        fallback={
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Access Denied
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                You don't have permission to access user management.
              </p>
            </div>
          </div>
        }
      >
        <PageBreadcrumb pageTitle="User Management" />

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <div className="mb-5 flex items-center justify-between lg:mb-7">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Users Management
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                View and manage user accounts and their status
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Total Users: {usersData?.total || 0}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <UserList />
          </div>
        </div>
      </PermissionGuard>
    </>
  );
}
