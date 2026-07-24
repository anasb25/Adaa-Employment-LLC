import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { suppliersApi } from "../services/api/suppliersApi";
import { Supplier } from "../types/supplier";
import Input from "../components/form/input/InputField";
import Label from "../components/form/Label";
import Button from "../components/ui/button/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Modal } from "../components/ui/ReusableModal";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import PermissionGuard from "../components/auth/PermissionGuard";
import { QUERY_KEYS } from "../lib/constants";
import { useConfirmDialog } from "../providers/ConfirmDialogProvider";
import { PlusIcon } from "../icons";

export default function SupplierManagement() {
  const queryClient = useQueryClient();
  const confirmDialog = useConfirmDialog();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [name, setName] = useState("");

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.suppliers.all,
    queryFn: () => suppliersApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (supplierName: string) =>
      suppliersApi.create({ name: supplierName }),
    onSuccess: () => {
      toast.success("Supplier created");
      closeModal();
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.suppliers.all });
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message || "Failed to create supplier");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, supplierName }: { id: number; supplierName: string }) =>
      suppliersApi.update(id, { name: supplierName }),
    onSuccess: () => {
      toast.success("Supplier updated");
      closeModal();
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.suppliers.all });
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message || "Failed to update supplier");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => suppliersApi.remove(id),
    onSuccess: () => {
      toast.success("Supplier deleted");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.suppliers.all });
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message || "Failed to delete supplier");
    },
  });

  const openCreateModal = () => {
    setEditingSupplier(null);
    setName("");
    setIsModalOpen(true);
  };

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setName(supplier.name);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
    setName("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Supplier name is required");
      return;
    }

    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier.id, supplierName: trimmed });
    } else {
      createMutation.mutate(trimmed);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirmDialog({
      title: "Delete Supplier",
      message:
        "Delete this supplier? Employees linked to it will be unassigned.",
      confirmText: "Delete",
      variant: "warning",
    });
    if (confirmed) {
      deleteMutation.mutate(id);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <PageMeta
        title="Suppliers | ADAA Employment LLC"
        description="Manage suppliers linked to employees"
      />
      <PermissionGuard
        permission="employee:read"
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
              <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
                Access Denied
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                You don't have permission to access suppliers.
              </p>
            </div>
          </div>
        }
      >
        <PageBreadcrumb pageTitle="Suppliers" />

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <div className="mb-5 flex flex-col gap-4 lg:mb-7 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Manage Suppliers
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Add supplier names and assign them to employees
              </p>
            </div>

            <PermissionGuard permission="employee:create">
              <Button onClick={openCreateModal} startIcon={<PlusIcon />}>
                Add Supplier
              </Button>
            </PermissionGuard>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Name
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
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
                  {!isLoading && suppliers.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={2}
                        className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                      >
                        No suppliers yet. Click Add Supplier to create one.
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading &&
                    suppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell className="px-5 py-4">
                          <span className="font-medium text-theme-sm text-gray-800 dark:text-white/90">
                            {supplier.name}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <PermissionGuard permission="employee:update">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditModal(supplier)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(supplier.id)}
                                disabled={deleteMutation.isPending}
                              >
                                Delete
                              </Button>
                            </div>
                          </PermissionGuard>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={editingSupplier ? "Edit Supplier" : "Add Supplier"}
          size="sm"
        >
          <form onSubmit={handleSubmit} className="space-y-5 p-6">
            <div>
              <Label htmlFor="supplier-name">
                Supplier Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="supplier-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter supplier name"
                required
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={closeModal}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving
                  ? "Saving..."
                  : editingSupplier
                    ? "Save Changes"
                    : "Add Supplier"}
              </Button>
            </div>
          </form>
        </Modal>
      </PermissionGuard>
    </>
  );
}
