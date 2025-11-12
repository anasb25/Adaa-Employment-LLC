import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { skillTypesApi } from "../services/api/skillTypesApi";
import { SkillType } from "../types/skill";
import Input from "../components/form/input/InputField";
import Button from "../components/ui/button/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import PermissionGuard from "../components/auth/PermissionGuard";
import { QUERY_KEYS } from "../lib/constants";

export default function SkillTypesManagement() {
  const queryClient = useQueryClient();
  const [newType, setNewType] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");

  const { data: types = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.skillTypes.all,
    queryFn: () => skillTypesApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (type: string) => skillTypesApi.create(type),
    onSuccess: () => {
      toast.success("Skill type created");
      setNewType("");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.skillTypes.all });
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message || "Failed to create skill type");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, type }: { id: number; type: string }) =>
      skillTypesApi.update(id, type),
    onSuccess: () => {
      toast.success("Skill type updated");
      setEditingId(null);
      setEditingValue("");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.skillTypes.all });
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message || "Failed to update skill type");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => skillTypesApi.remove(id),
    onSuccess: () => {
      toast.success("Skill type deleted");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.skillTypes.all });
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message || "Failed to delete skill type");
    },
  });

  const handleCreate = () => {
    if (!newType.trim()) {
      toast.error("Type is required");
      return;
    }
    createMutation.mutate(newType.trim());
  };

  const handleStartEdit = (type: SkillType) => {
    setEditingId(type.id);
    setEditingValue(type.type);
  };

  const handleSaveEdit = () => {
    if (editingId == null) return;
    if (!editingValue.trim()) {
      toast.error("Type is required");
      return;
    }
    updateMutation.mutate({ id: editingId, type: editingValue.trim() });
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Delete this skill type?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <>
      <PageMeta
        title="Skill Types | ADAA Employment LLC"
        description="Manage skill types used across the application"
      />
      <PermissionGuard
        permission="skill:read"
        fallback={
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Access Denied
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                You don't have permission to access skill types.
              </p>
            </div>
          </div>
        }
      >
        <PageBreadcrumb pageTitle="Skill Types" />

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <div className="mb-5 flex items-center justify-between lg:mb-7">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Manage Skill Types
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Create, edit, and delete the list of available skill types
              </p>
            </div>

            <PermissionGuard permission="skill:create">
              <div className="flex items-center gap-3">
                <Input
                  type="text"
                  placeholder="New type (e.g., White Collar)"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="max-w-sm"
                />
                <Button
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "Adding..." : "Add Type"}
                </Button>
              </div>
            </PermissionGuard>
          </div>

          <div className="space-y-6">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Type
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {isLoading && (
                      <TableRow>
                        <TableCell className="px-5 py-4">Loading...</TableCell>
                        <TableCell />
                      </TableRow>
                    )}
                    {!isLoading &&
                      types.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="px-5 py-4">
                            {editingId === t.id ? (
                              <Input
                                type="text"
                                value={editingValue}
                                onChange={(e) =>
                                  setEditingValue(e.target.value)
                                }
                                className="max-w-sm"
                              />
                            ) : (
                              <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                                {t.type}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="px-5 py-4">
                            {editingId === t.id ? (
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setEditingId(null);
                                    setEditingValue("");
                                  }}
                                >
                                  Cancel
                                </Button>
                                <PermissionGuard permission="skill:update">
                                  <Button
                                    onClick={handleSaveEdit}
                                    disabled={updateMutation.isPending}
                                  >
                                    {updateMutation.isPending
                                      ? "Saving..."
                                      : "Save"}
                                  </Button>
                                </PermissionGuard>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <PermissionGuard permission="skill:update">
                                  <Button
                                    variant="outline"
                                    onClick={() => handleStartEdit(t)}
                                  >
                                    Edit
                                  </Button>
                                </PermissionGuard>
                                <PermissionGuard permission="skill:delete">
                                  <Button
                                    variant="outline"
                                    onClick={() => handleDelete(t.id)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                                    disabled={deleteMutation.isPending}
                                  >
                                    Delete
                                  </Button>
                                </PermissionGuard>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      </PermissionGuard>
    </>
  );
}
