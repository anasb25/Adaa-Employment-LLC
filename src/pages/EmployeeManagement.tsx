import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { employeesApi } from "../services/api/employeesApi";
import { QUERY_KEYS } from "../lib/constants";
import EmployeeList from "../components/employees/EmployeeList";
import EmployeeForm from "../components/employees/EmployeeForm";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import PermissionGuard from "../components/auth/PermissionGuard";
import { Modal } from "../components/ui/ReusableModal";
import Button from "../components/ui/button/Button";
import { Employee } from "../types/employee";
import { PlusIcon } from "../icons";

export default function EmployeeManagementPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const { data: employeesData } = useQuery({
    queryKey: [QUERY_KEYS.employees.all, 1, 10],
    queryFn: () => employeesApi.getEmployees(1, 10),
  });

  const handleCreateClick = () => {
    setEditingEmployee(null);
    setIsCreateModalOpen(true);
  };

  const handleEditClick = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsCreateModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingEmployee(null);
  };

  return (
    <>
      <PageMeta
        title="Employee Management | ADAA Employment LLC"
        description="Manage employees and their information for ADAA Employment LLC"
      />
      <PermissionGuard
        permission="employee:read"
        fallback={
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Access Denied
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                You don't have permission to access employee management.
              </p>
            </div>
          </div>
        }
      >
        <PageBreadcrumb pageTitle="Employee Management" />

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <div className="mb-5 flex items-center justify-between lg:mb-7">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Employees Management
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                View and manage employee records and information
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Total Employees: {employeesData?.total || 0}
              </div>
              <PermissionGuard permission="employee:create">
                <Button onClick={handleCreateClick} startIcon={<PlusIcon />}>
                  Create Employee
                </Button>
              </PermissionGuard>
            </div>
          </div>

          <div className="space-y-6">
            <EmployeeList
              onCreateEmployee={handleCreateClick}
              onEditEmployee={handleEditClick}
            />
          </div>
        </div>

        {/* Create/Edit Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={handleCloseModal}
          title={editingEmployee ? "Edit Employee" : "Create New Employee"}
          size="xl"
        >
          <div className="p-6">
            <EmployeeForm
              employee={editingEmployee || undefined}
              onClose={handleCloseModal}
            />
          </div>
        </Modal>
      </PermissionGuard>
    </>
  );
}
