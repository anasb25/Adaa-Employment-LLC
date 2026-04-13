import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { invoicesApi } from "../services/api/invoicesApi";
import { projectsApi } from "../services/api/projectsApi";
import { QUERY_KEYS } from "../lib/constants";
import {
  Invoice,
  InvoiceStatus,
  GenerateInvoiceRequest,
} from "../types/invoice";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import PermissionGuard from "../components/auth/PermissionGuard";
import Button from "../components/ui/button/Button";
import Label from "../components/form/Label";
import Input from "../components/form/input/InputField";
import Select from "../components/form/Select";
import {
  FileIcon,
  DownloadIcon,
  BoltIcon,
  PlusIcon,
  CheckCircleIcon,
  MailIcon,
} from "../icons";

const STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  approved: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  sent: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

export default function InvoiceManagement() {
  const queryClient = useQueryClient();

  // Get current month as default
  const currentDate = new Date();
  const currentMonth = `${currentDate.getFullYear()}-${String(
    currentDate.getMonth() + 1
  ).padStart(2, "0")}`;

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [generateForm, setGenerateForm] = useState<GenerateInvoiceRequest>({
    projectId: 0,
    month: currentMonth,
  });

  // Fetch projects
  const { data: projectsData } = useQuery({
    queryKey: QUERY_KEYS.projects.all,
    queryFn: () => projectsApi.getProjects(),
  });

  // Fetch invoices
  const { data: invoicesData, isLoading } = useQuery({
    queryKey: ["invoices", selectedMonth, selectedProject, selectedStatus],
    queryFn: () =>
      invoicesApi.getInvoices({
        month: selectedMonth || undefined,
        projectId: selectedProject ? parseInt(selectedProject) : undefined,
        status: selectedStatus || undefined,
      }),
    enabled: true,
  });

  // Generate invoice mutation
  const generateMutation = useMutation({
    mutationFn: invoicesApi.generateInvoice,
    onSuccess: () => {
      toast.success("Invoice generated successfully!");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setIsGenerateModalOpen(false);
      setGenerateForm({ projectId: 0, month: currentMonth });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to generate invoice"
      );
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: invoicesApi.approveInvoice,
    onSuccess: () => {
      toast.success("Invoice approved successfully!");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to approve invoice");
    },
  });

  // Send mutation
  const sendMutation = useMutation({
    mutationFn: invoicesApi.markAsSent,
    onSuccess: () => {
      toast.success("Invoice marked as sent!");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to mark as sent");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: invoicesApi.deleteInvoice,
    onSuccess: () => {
      toast.success("Invoice deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete invoice");
    },
  });

  const handleGenerate = () => {
    if (!generateForm.projectId) {
      toast.error("Please select a project");
      return;
    }
    generateMutation.mutate(generateForm);
  };

  const handleApprove = (id: number) => {
    if (window.confirm("Are you sure you want to approve this invoice?")) {
      approveMutation.mutate(id);
    }
  };

  const handleMarkAsSent = (id: number) => {
    if (window.confirm("Are you sure you want to mark this invoice as sent?")) {
      sendMutation.mutate(id);
    }
  };

  const handleDelete = (id: number) => {
    if (
      window.confirm(
        "Are you sure you want to delete this invoice? This action cannot be undone."
      )
    ) {
      deleteMutation.mutate(id);
    }
  };

  const deleteManyMutation = useMutation({
    mutationFn: (ids: number[]) => invoicesApi.deleteMany(ids),
    onSuccess: (data) => {
      let msg = `${data.deleted} invoice(s) deleted successfully!`;
      if (data.skipped > 0) msg += ` ${data.skipped} paid invoice(s) were skipped.`;
      toast.success(msg);
      setSelectedIds(new Set());
      setIsSelectMode(false);
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete invoices");
    },
  });

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedIds.size} invoice(s)?`)) {
      deleteManyMutation.mutate(Array.from(selectedIds));
    }
  };

  const handleDownloadPdf = async (
    invoiceNumber: string,
    invoiceId: number
  ) => {
    try {
      const blob = await invoicesApi.downloadPdf(invoiceId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Invoice-${invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to download PDF");
    }
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[status]}`}
      >
        {status.replace("_", " ").toUpperCase()}
      </span>
    );
  };

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    if (numAmount == null || isNaN(numAmount)) {
      return "AED 0.00";
    }
    return `AED ${numAmount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      <PageMeta
        title="Invoice Management | ADAA Employment LLC"
        description="Manage client invoices"
      />
      <PermissionGuard
        permission="timesheet:read"
        fallback={
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Access Denied
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                You don't have permission to access invoices.
              </p>
            </div>
          </div>
        }
      >
        <PageBreadcrumb pageTitle="Invoice Management" />

        <div className="space-y-6">
          {/* Filters */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <Label>Month</Label>
                <Input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                />
              </div>

              <div>
                <Label>Project</Label>
                <Select
                  options={[
                    { value: "", label: "All Projects" },
                    ...(projectsData?.data || []).map((p) => ({
                      value: String(p.id),
                      label: p.name,
                    })),
                  ]}
                  value={selectedProject}
                  onChange={setSelectedProject}
                  placeholder="Select project"
                />
              </div>

              <div>
                <Label>Status</Label>
                <Select
                  options={[
                    { value: "", label: "All Statuses" },
                    { value: "draft", label: "Draft" },
                    { value: "pending", label: "Pending" },
                    { value: "approved", label: "Approved" },
                    { value: "sent", label: "Sent" },
                    { value: "paid", label: "Paid" },
                  ]}
                  value={selectedStatus}
                  onChange={setSelectedStatus}
                  placeholder="Select status"
                />
              </div>

              <div className="flex items-end">
                <Button
                  onClick={() => setIsGenerateModalOpen(true)}
                  startIcon={<PlusIcon />}
                  className="w-full"
                >
                  Generate Invoice
                </Button>
                {!isSelectMode ? (
                  <Button
                    variant="outline"
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                    onClick={() => setIsSelectMode(true)}
                  >
                    Delete Multiple
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 w-full">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedIds.size} selected
                    </span>
                    <Button
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                      onClick={handleDeleteSelected}
                      disabled={selectedIds.size === 0 || deleteManyMutation.isPending}
                    >
                      {deleteManyMutation.isPending ? "Deleting..." : "Confirm Delete"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => { setIsSelectMode(false); setSelectedIds(new Set()); }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Invoices List */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            {isLoading ? (
              <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                Loading invoices...
              </div>
            ) : invoicesData?.data?.length === 0 ? (
              <div className="p-12 text-center">
                <FileIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  No invoices found
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Generate an invoice to get started
                </p>
                <Button
                  onClick={() => setIsGenerateModalOpen(true)}
                  startIcon={<PlusIcon />}
                  variant="outline"
                >
                  Generate Invoice
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                  <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                      {isSelectMode && (
                        <th className="px-6 py-3 w-10">
                          <input
                            type="checkbox"
                            checked={
                              invoicesData?.data &&
                              invoicesData.data.length > 0 &&
                              invoicesData.data.every((inv: Invoice) => selectedIds.has(inv.id))
                            }
                            onChange={() => {
                              if (!invoicesData?.data) return;
                              const allIds = invoicesData.data.map((inv: Invoice) => inv.id);
                              if (allIds.every((id: number) => selectedIds.has(id))) {
                                setSelectedIds(new Set());
                              } else {
                                setSelectedIds(new Set(allIds));
                              }
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                          />
                        </th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Invoice #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Project
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Month
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Invoice Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {invoicesData?.data?.map((invoice: any) => (
                      <tr
                        key={invoice.id}
                        className={`${
                          isSelectMode && selectedIds.has(invoice.id)
                            ? "bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20"
                            : "hover:bg-gray-50 dark:hover:bg-gray-900/30"
                        }`}
                      >
                        {isSelectMode && (
                          <td className="px-6 py-4 w-10">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(invoice.id)}
                              onChange={() => toggleSelect(invoice.id)}
                              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                            />
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {invoice.invoiceNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                          {invoice.project?.name || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                          {new Date(invoice.month + "-01").toLocaleString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                            }
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                          {formatDate(invoice.invoiceDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                          {formatDate(invoice.dueDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(invoice.totalAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {getStatusBadge(invoice.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() =>
                                window.open(`/invoices/${invoice.id}`, "_blank")
                              }
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              title="View"
                            >
                              View
                            </button>

                            <span className="text-gray-300">|</span>
                            <button
                              onClick={() =>
                                handleDownloadPdf(
                                  invoice.invoiceNumber,
                                  invoice.id
                                )
                              }
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                              title="Download PDF"
                            >
                              PDF
                            </button>

                            {invoice.status === "draft" && (
                              <>
                                <span className="text-gray-300">|</span>
                                <button
                                  onClick={() => handleApprove(invoice.id)}
                                  className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                  title="Approve"
                                >
                                  Approve
                                </button>
                              </>
                            )}

                            {invoice.status === "approved" && (
                              <>
                                <span className="text-gray-300">|</span>
                                <button
                                  onClick={() => handleMarkAsSent(invoice.id)}
                                  className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                                  title="Mark as Sent"
                                >
                                  Send
                                </button>
                              </>
                            )}

                            {invoice.status !== "paid" && (
                              <>
                                <span className="text-gray-300">|</span>
                                <button
                                  onClick={() => handleDelete(invoice.id)}
                                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                  title="Delete"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Generate Invoice Modal */}
        {isGenerateModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                Generate Invoice
              </h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="project">Project *</Label>
                  <Select
                    options={(projectsData?.data || []).map((p) => ({
                      value: String(p.id),
                      label: p.name,
                    }))}
                    value={
                      generateForm.projectId
                        ? String(generateForm.projectId)
                        : ""
                    }
                    onChange={(v) =>
                      setGenerateForm({ ...generateForm, projectId: Number(v) })
                    }
                    placeholder="Select project"
                  />
                </div>

                <div>
                  <Label htmlFor="month">Month *</Label>
                  <Input
                    type="month"
                    value={generateForm.month}
                    onChange={(e) =>
                      setGenerateForm({
                        ...generateForm,
                        month: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsGenerateModalOpen(false);
                    setGenerateForm({ projectId: 0, month: currentMonth });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending}
                  startIcon={<BoltIcon />}
                >
                  {generateMutation.isPending ? "Generating..." : "Generate"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </PermissionGuard>
    </>
  );
}
