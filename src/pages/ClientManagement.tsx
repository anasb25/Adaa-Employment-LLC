import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientsApi } from "../services/api/clientsApi";
import { QUERY_KEYS } from "../lib/constants";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
import Input from "../components/form/input/InputField";
import Label from "../components/form/Label";
import { Modal } from "../components/ui/ReusableModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { toast } from "sonner";
import { Client, CreateClientRequest } from "../types/client";

export default function ClientManagement() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState<CreateClientRequest>({
    name: "",
    address: "",
    contactPerson: "",
    contactNumber: "",
    email: "",
    notes: "",
  });
  const queryClient = useQueryClient();
  const {
    data: clientsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.clients.all,
    queryFn: () => clientsApi.getClients(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateClientRequest) => clientsApi.createClient(data),
    onSuccess: () => {
      toast.success("Client saved");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
      setIsModalOpen(false);
      setEditing(null);
      setForm({
        name: "",
        address: "",
        contactPerson: "",
        contactNumber: "",
        email: "",
        notes: "",
      });
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message || "Failed to save client");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateClientRequest }) =>
      clientsApi.updateClient(id, data),
    onSuccess: () => {
      toast.success("Client updated");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
      setIsModalOpen(false);
      setEditing(null);
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message || "Failed to update client");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => clientsApi.deleteClient(id),
    onSuccess: () => {
      toast.success("Client deleted");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message || "Failed to delete client");
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: "",
      address: "",
      contactPerson: "",
      contactNumber: "",
      email: "",
      notes: "",
    });
    setIsModalOpen(true);
  };

  const openEdit = (c: Client) => {
    setEditing(c);
    setForm({
      name: c.name || "",
      address: c.address || "",
      contactPerson: c.contactPerson || "",
      contactNumber: c.contactNumber || "",
      email: c.email || "",
      notes: c.notes || "",
    });
    setIsModalOpen(true);
  };

  const save = () => {
    if (!form.name?.trim()) {
      toast.error("Name is required");
      return;
    }
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const remove = (id: number) => {
    if (window.confirm("Delete this client?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <>
      <PageMeta
        title="Clients | ADAA Employment LLC"
        description="Manage clients"
      />
      <PageBreadcrumb pageTitle="Clients" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="mb-5 flex items-center justify-between lg:mb-7">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Clients
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              View and manage clients
            </p>
          </div>
          <Button onClick={openCreate}>+ Add Client</Button>
        </div>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell
                    isHeader
                    className="px-5 py-3 text-theme-xs text-gray-500 text-start"
                  >
                    Name
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 text-theme-xs text-gray-500 text-start"
                  >
                    Contact
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 text-theme-xs text-gray-500 text-start"
                  >
                    Email
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
                {clientsData?.data?.map((c: Client) => (
                  <TableRow key={c.id}>
                    <TableCell className="px-5 py-4 text-gray-800 dark:text-white/90">
                      {c.name}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-800 dark:text-white/90">
                      {c.contactNumber || "-"}
                      {c.contactPerson ? (
                        <span className="ml-2 text-xs italic text-gray-600 dark:text-gray-400">
                          - {c.contactPerson}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-800 dark:text-white/90">
                      {c.email || "-"}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-800 dark:text-white/90">
                      {c.notes || "-"}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-800 dark:text-white/90">
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => openEdit(c)}>
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                          onClick={() => remove(c.id)}
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
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editing ? "Edit Client" : "Add Client"}
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2">
          <div>
            <Label htmlFor="client-name">Name</Label>
            <Input
              id="client-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="client-address">Address</Label>
            <Input
              id="client-address"
              value={form.address || ""}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="client-contact-person">Contact Person</Label>
            <Input
              id="client-contact-person"
              value={form.contactPerson || ""}
              onChange={(e) =>
                setForm({ ...form, contactPerson: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="client-contact-number">Contact Number</Label>
            <Input
              id="client-contact-number"
              value={form.contactNumber || ""}
              onChange={(e) =>
                setForm({ ...form, contactNumber: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="client-email">Email</Label>
            <Input
              id="client-email"
              type="email"
              value={form.email || ""}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="client-notes">Notes</Label>
            <Input
              id="client-notes"
              value={form.notes || ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 p-4">
          <Button variant="outline" onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={save}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending
              ? "Saving..."
              : "Save"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
