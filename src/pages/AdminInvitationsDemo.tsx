import React from "react";
import InvitationsPage from "../components/invitations/InvitationsPage";
import PermissionGuard from "../components/auth/PermissionGuard";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";

const AdminInvitationsDemo: React.FC = () => {
  return (
    <>
      <PageMeta
        title="User Invitations | ADAA Employment LLC"
        description="Manage user invitations and role assignments for ADAA Employment LLC"
      />
      <PermissionGuard
        permission="user:create"
        fallback={
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Access Denied
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                You don't have permission to access this page.
              </p>
            </div>
          </div>
        }
      >
        <PageBreadcrumb pageTitle="User Invitations" />
        <InvitationsPage />
      </PermissionGuard>
    </>
  );
};

export default AdminInvitationsDemo;
