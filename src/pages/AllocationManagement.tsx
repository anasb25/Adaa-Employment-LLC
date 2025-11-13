import { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { allocationsApi } from "../services/api/allocationsApi";
import { QUERY_KEYS } from "../lib/constants";
import {
  ProjectAllocation,
  UpdateAllocationRequest,
} from "../types/allocation";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import PermissionGuard from "../components/auth/PermissionGuard";
import Button from "../components/ui/button/Button";
import { Modal } from "../components/ui/ReusableModal";
import Input from "../components/form/input/InputField";
import Label from "../components/form/Label";
import DatePicker from "../components/form/date-picker";
import Badge from "../components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { PlusIcon } from "../icons";

export default function AllocationManagement() {
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectAllocation | null>(null);
  const queryClient = useQueryClient();

  const [editForm, setEditForm] = useState<UpdateAllocationRequest>({
    startDate: "",
    endDate: "",
    notes: "",
  });

  const { data: allocationsData, isLoading } = useQuery({
    queryKey: QUERY_KEYS.allocations.all,
    queryFn: () => allocationsApi.getAllocations(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAllocationRequest }) =>
      allocationsApi.updateAllocation(id, data),
    onSuccess: () => {
      toast.success("Allocation updated successfully!");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allocations.all });
      setIsEditModalOpen(false);
      setEditing(null);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to update allocation"
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => allocationsApi.deleteAllocation(id),
    onSuccess: () => {
      toast.success("Allocation deleted successfully!");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allocations.all });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to delete allocation"
      );
    },
  });

  const openEdit = (alloc: ProjectAllocation) => {
    setEditing(alloc);
    setEditForm({
      startDate: alloc.startDate.split("T")[0],
      endDate: alloc.endDate ? alloc.endDate.split("T")[0] : "",
      notes: alloc.notes || "",
    });
    setIsEditModalOpen(true);
  };

  const saveEdit = () => {
    if (!editing) return;
    if (!editForm.startDate) {
      toast.error("Start date is required");
      return;
    }

    const payload: UpdateAllocationRequest = {
      startDate: editForm.startDate,
      endDate: editForm.endDate || undefined,
      notes: editForm.notes || undefined,
    };

    updateMutation.mutate({ id: editing.id, data: payload });
  };

  const remove = (id: number) => {
    if (window.confirm("Delete this allocation?")) {
      deleteMutation.mutate(id);
    }
  };

  // Group allocations by project
  const groupedAllocations = (allocationsData?.data || []).reduce(
    (acc: any, alloc: ProjectAllocation) => {
      const projectKey = alloc.projectId;
      if (!acc[projectKey]) {
        acc[projectKey] = {
          project: alloc.project,
          allocations: [],
        };
      }
      acc[projectKey].allocations.push(alloc);
      return acc;
    },
    {}
  );

  return (
    <>
      <PageMeta
        title="Project Allocations | ADAA Employment LLC"
        description="Manage employee allocations to projects"
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
                You don't have permission to access allocations.
              </p>
            </div>
          </div>
        }
      >
        <PageBreadcrumb pageTitle="Project Allocations" />

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <div className="mb-5 flex items-center justify-between lg:mb-7">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Employee-Project Allocations
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage employee assignments to projects
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Total: {allocationsData?.total || 0} allocation(s)
              </div>
              <PermissionGuard permission="employee:create">
                <Button
                  onClick={() => navigate("/allocations/create")}
                  startIcon={<PlusIcon />}
                >
                  Allocate Employees
                </Button>
              </PermissionGuard>
            </div>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {!isLoading && Object.keys(groupedAllocations).length > 0 && (
            <div className="space-y-6">
              {Object.values(groupedAllocations).map((group: any) => (
                <div
                  key={group.project.id}
                  className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <div className="bg-gray-50 dark:bg-gray-800/50 px-5 py-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {group.project.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {group.project.location} • Client:{" "}
                          {group.project.client?.name}
                        </p>
                      </div>
                      <Badge color="secondary" size="sm">
                        {group.allocations.length} employee(s)
                      </Badge>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                        <TableRow>
                          <TableCell
                            isHeader
                            className="px-5 py-3 text-theme-xs text-gray-500 text-start"
                          >
                            Employee
                          </TableCell>
                          <TableCell
                            isHeader
                            className="px-5 py-3 text-theme-xs text-gray-500 text-start"
                          >
                            Skills
                          </TableCell>
                          <TableCell
                            isHeader
                            className="px-5 py-3 text-theme-xs text-gray-500 text-start"
                          >
                            Period
                          </TableCell>
                          <TableCell
                            isHeader
                            className="px-5 py-3 text-theme-xs text-gray-500 text-start"
                          >
                            Notes
                          </TableCell>
                          <TableCell
                            isHeader
                            className="px-5 py-3 text-theme-xs text-gray-500 text-start"
                          >
                            Actions
                          </TableCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                        {group.allocations.map((alloc: ProjectAllocation) => (
                          <TableRow key={alloc.id}>
                            <TableCell className="px-5 py-4 text-gray-800 dark:text-white/90 text-start">
                              {alloc.employee?.name || "—"}
                              <br />
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {alloc.employee?.adaa_emp_code || ""}
                              </span>
                            </TableCell>
                            <TableCell className="px-5 py-4 text-start">
                              <div className="flex flex-wrap gap-1">
                                {alloc.employee?.employeeSkills &&
                                alloc.employee.employeeSkills.length > 0 ? (
                                  alloc.employee.employeeSkills.map(
                                    (es: any) => (
                                      <Badge
                                        key={es.id}
                                        color="light"
                                        size="sm"
                                      >
                                        {es.skill?.skill}
                                      </Badge>
                                    )
                                  )
                                ) : (
                                  <span className="text-gray-500 dark:text-gray-400">
                                    —
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="px-5 py-4 text-gray-800 dark:text-white/90 text-start">
                              {new Date(alloc.startDate).toLocaleDateString()}
                              {" → "}
                              {alloc.endDate
                                ? new Date(alloc.endDate).toLocaleDateString()
                                : "Ongoing"}
                            </TableCell>
                            <TableCell className="px-5 py-4 text-gray-800 dark:text-white/90 text-start">
                              {alloc.notes || "—"}
                            </TableCell>
                            <TableCell className="px-5 py-4 text-start">
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => openEdit(alloc)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                                  onClick={() => remove(alloc.id)}
                                >
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && allocationsData?.data.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No allocations found. Start by allocating employees to a
                project.
              </p>
              <Button onClick={() => navigate("/allocations/create")}>
                Allocate Employees
              </Button>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditing(null);
          }}
          title="Edit Allocation"
          size="md"
        >
          <div className="space-y-4 p-6">
            <div>
              <Label htmlFor="editStartDate">
                Start Date <span className="text-red-500">*</span>
              </Label>
              <DatePicker
                key={`start-${editing?.id || "new"}`}
                id="editStartDate"
                placeholder="Select start date"
                defaultDate={
                  editForm.startDate ? new Date(editForm.startDate) : undefined
                }
                onChange={(_dates, currentDateString) => {
                  setEditForm({ ...editForm, startDate: currentDateString });
                }}
              />
            </div>

            <div>
              <Label htmlFor="editEndDate">End Date</Label>
              <DatePicker
                key={`end-${editing?.id || "new"}`}
                id="editEndDate"
                placeholder="Select end date"
                defaultDate={
                  editForm.endDate ? new Date(editForm.endDate) : undefined
                }
                onChange={(_dates, currentDateString) => {
                  setEditForm({ ...editForm, endDate: currentDateString });
                }}
              />
            </div>

            <div>
              <Label htmlFor="editNotes">Notes</Label>
              <Input
                id="editNotes"
                value={editForm.notes || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, notes: e.target.value })
                }
                placeholder="Additional information"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 p-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditing(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </Modal>
      </PermissionGuard>
    </>
  );
}
