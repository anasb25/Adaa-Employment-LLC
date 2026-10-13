import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { specialDaysApi } from "../services/api/specialDaysApi";
import { SpecialDay, CreateSpecialDayRequest, SpecialDayType } from "../types/special-day";
import Button from "../components/ui/button/Button";
import Label from "../components/form/Label";
import Select from "../components/form/Select";
import { PlusIcon, PencilIcon, TrashBinIcon } from "../icons";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import { useConfirmDialog } from "../providers/ConfirmDialogProvider";
import PermissionGuard from "../components/auth/PermissionGuard";

export default function SpecialDaysManagement() {
  const queryClient = useQueryClient();
  const confirmDialog = useConfirmDialog();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<SpecialDay | null>(null);
  const [searchCategory, setSearchCategory] = useState("");
  const [searchYear, setSearchYear] = useState<number>(new Date().getFullYear());

  const [form, setForm] = useState<CreateSpecialDayRequest>({
    name: "",
    category: "",
    startDate: "",
    endDate: "",
    description: "",
    isActive: true,
    isRecurring: false,
    color: "#3b82f6",
    dayType: SpecialDayType.REGULAR,
    employeeAdditionalAmount: 0,
    clientRateMultiplier: 1.0,
    isDefaultOff: false,
    minBillingHours: null,
    billingHoursThreshold: null,
    additionalHoursAboveThreshold: null,
    notes: "",
  });

  // Fetch special days
  const { data: specialDays, isLoading } = useQuery({
    queryKey: ["specialDays", searchCategory, searchYear],
    queryFn: () =>
      specialDaysApi.getSpecialDays({
        category: searchCategory || undefined,
        year: searchYear,
      }),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: specialDaysApi.createSpecialDay,
    onSuccess: () => {
      toast.success("Special day created successfully!");
      queryClient.invalidateQueries({ queryKey: ["specialDays"] });
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create special day");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateSpecialDayRequest }) =>
      specialDaysApi.updateSpecialDay(id, data),
    onSuccess: () => {
      toast.success("Special day updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["specialDays"] });
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update special day");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: specialDaysApi.deleteSpecialDay,
    onSuccess: () => {
      toast.success("Special day deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["specialDays"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete special day");
    },
  });

  const openCreate = () => {
    setEditingDay(null);
    setForm({
      name: "",
      category: "",
      startDate: "",
      endDate: "",
      description: "",
      isActive: true,
      isRecurring: false,
      color: "#3b82f6",
      dayType: SpecialDayType.REGULAR,
      employeeAdditionalAmount: 0,
      clientRateMultiplier: 1.0,
      isDefaultOff: false,
      minBillingHours: null,
      billingHoursThreshold: null,
      additionalHoursAboveThreshold: null,
      notes: "",
    });
    setIsModalOpen(true);
  };

  const openEdit = (day: SpecialDay) => {
    setEditingDay(day);
    setForm({
      name: day.name,
      category: day.category || "",
      startDate: day.startDate,
      endDate: day.endDate || "",
      description: day.description || "",
      isActive: day.isActive,
      isRecurring: day.isRecurring,
      color: day.color || "#3b82f6",
      dayType: day.dayType || SpecialDayType.REGULAR,
      employeeAdditionalAmount: day.employeeAdditionalAmount ?? 0,
      clientRateMultiplier: day.clientRateMultiplier || 1.0,
      isDefaultOff: day.isDefaultOff || false,
      minBillingHours: day.minBillingHours ?? null,
      billingHoursThreshold: day.billingHoursThreshold ?? null,
      additionalHoursAboveThreshold: day.additionalHoursAboveThreshold ?? null,
      notes: day.notes || "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDay(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDay) {
      updateMutation.mutate({ id: editingDay.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirmDialog({
      title: "Delete Special Day",
      message: "Are you sure you want to delete this special day?",
      confirmText: "Delete",
      variant: "warning",
    });
    if (confirmed) {
      deleteMutation.mutate(id);
    }
  };

  // Get unique categories for filter
  const categories = Array.from(
    new Set(specialDays?.map((d) => d.category).filter(Boolean))
  );

  return (
    <>
      <PageMeta
        title="Special Days Management"
        description="Manage public holidays, Ramadan days, and other special occasions"
      />
      <PermissionGuard
        permission="special-day:read"
        fallback={
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Access Denied
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                You don&apos;t have permission to access special days management.
              </p>
            </div>
          </div>
        }
      >
      <PageBreadcrumb pageTitle="Special Days Management" />

      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Special Days Management
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Manage public holidays, Ramadan, and other special occasions
              </p>
            </div>
            <PermissionGuard permission="special-day:create">
              <Button onClick={openCreate} startIcon={<PlusIcon />}>
                Add Special Day
              </Button>
            </PermissionGuard>
          </div>

          {/* Filters */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="filterCategory">Category</Label>
              <Select
                id="filterCategory"
                options={[
                  { value: "", label: "All Categories" },
                  ...categories.map((cat) => ({ value: cat, label: cat })),
                ]}
                value={searchCategory}
                onChange={setSearchCategory}
                placeholder="All Categories"
              />
            </div>
            <div>
              <Label htmlFor="filterYear">Year</Label>
              <input
                id="filterYear"
                type="number"
                value={searchYear}
                onChange={(e) => setSearchYear(parseInt(e.target.value))}
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Special Days List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Loading special days...
              </p>
            </div>
          ) : specialDays && specialDays.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Start Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      End Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Rates
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Recurring
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {specialDays.map((day) => (
                    <tr key={day.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {day.color && (
                            <div
                              className="w-3 h-3 rounded-full mr-3"
                              style={{ backgroundColor: day.color }}
                            ></div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {day.name}
                            </div>
                            {day.description && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {day.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {day.category || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            day.dayType === SpecialDayType.MANDATORY_OFF
                              ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                              : day.dayType === SpecialDayType.OPTIONAL_OFF
                              ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                              : day.dayType === SpecialDayType.PREMIUM_RATE
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                          }`}
                        >
                          {day.dayType === SpecialDayType.MANDATORY_OFF && "Mandatory Off"}
                          {day.dayType === SpecialDayType.OPTIONAL_OFF && "Optional Off"}
                          {day.dayType === SpecialDayType.PREMIUM_RATE && "Premium Rate"}
                          {day.dayType === SpecialDayType.REGULAR && "Regular"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {new Date(day.startDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {day.endDate
                          ? new Date(day.endDate).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {day.dayType === SpecialDayType.MANDATORY_OFF || day.dayType === SpecialDayType.REGULAR ? (
                          "-"
                        ) : (
                          <div>
                            <div>Employee: {day.employeeAdditionalAmount === 0 ? "0" : `+${day.employeeAdditionalAmount}`} AED/hr</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Client: {day.clientRateMultiplier}x multiplier
                            </div>
                            {day.minBillingHours != null && (
                              <div className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                                Bill: min {day.minBillingHours}h if &le;{day.billingHoursThreshold}h, else +{day.additionalHoursAboveThreshold}h
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            day.isActive
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {day.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {day.isRecurring ? "Yes" : "No"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openEdit(day)}
                          className="text-brand-600 hover:text-brand-900 dark:text-brand-400 dark:hover:text-brand-300 mr-4"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(day.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <TrashBinIcon className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                No special days found. Create one to get started.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-999999 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4">
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={closeModal}
            ></div>

            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {editingDay ? "Edit Special Day" : "Add Special Day"}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="name">Name *</Label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      placeholder="e.g., Eid Al Fitr, UAE National Day"
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Category</Label>
                    <input
                      id="category"
                      type="text"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      placeholder="e.g., Public Holiday, Ramadan"
                    />
                  </div>

                  <div>
                    <Label htmlFor="color">Color</Label>
                    <input
                      id="color"
                      type="color"
                      value={form.color}
                      onChange={(e) => setForm({ ...form, color: e.target.value })}
                      className="mt-1 w-full h-10 px-2 border border-gray-300 dark:border-gray-600 rounded-lg
                               bg-white dark:bg-gray-700
                               focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <Label htmlFor="startDate">Start Date *</Label>
                    <input
                      id="startDate"
                      type="date"
                      required
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <Label htmlFor="endDate">End Date (Optional)</Label>
                    <input
                      id="endDate"
                      type="date"
                      value={form.endDate}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <textarea
                      id="description"
                      rows={3}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      placeholder="Additional details about this day"
                    />
                  </div>

                  <div>
                    <Label htmlFor="dayType">Day Type *</Label>
                    <Select
                      id="dayType"
                      options={[
                        {
                          value: SpecialDayType.REGULAR,
                          label: "Regular (Reference Only)",
                        },
                        {
                          value: SpecialDayType.PREMIUM_RATE,
                          label: "Premium Rate",
                        },
                        {
                          value: SpecialDayType.OPTIONAL_OFF,
                          label: "Optional Off Day",
                        },
                        {
                          value: SpecialDayType.MANDATORY_OFF,
                          label: "Mandatory Off Day",
                        },
                      ]}
                      value={form.dayType}
                      onChange={(value) =>
                        setForm({
                          ...form,
                          dayType: value as SpecialDayType,
                        })
                      }
                      placeholder="Select day type"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {form.dayType === SpecialDayType.MANDATORY_OFF && "Cannot be overridden - all employees must be off"}
                      {form.dayType === SpecialDayType.OPTIONAL_OFF && "Default to off, but can work with premium rates"}
                      {form.dayType === SpecialDayType.PREMIUM_RATE && "Normal working day with premium billing rates"}
                      {form.dayType === SpecialDayType.REGULAR && "Just marked for reference, no special treatment"}
                    </p>
                  </div>

                  <div className="flex items-center pt-6">
                    <input
                      id="isDefaultOff"
                      type="checkbox"
                      checked={form.isDefaultOff}
                      onChange={(e) => setForm({ ...form, isDefaultOff: e.target.checked })}
                      className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                      disabled={form.dayType === SpecialDayType.MANDATORY_OFF}
                    />
                    <Label htmlFor="isDefaultOff" className="ml-2 mb-0">
                      Default to Off Status
                    </Label>
                  </div>

                  <div>
                    <Label htmlFor="employeeAdditionalAmount">Employee Additional Amount (AED/hr)</Label>
                    <div className="mt-1 relative">
                      <input
                        id="employeeAdditionalAmount"
                        type="number"
                        step="0.01"
                        value={form.employeeAdditionalAmount}
                        onChange={(e) => setForm({ ...form, employeeAdditionalAmount: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        disabled={form.dayType === SpecialDayType.MANDATORY_OFF || form.dayType === SpecialDayType.REGULAR}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Flat amount added to employee's base rate per hour. e.g., 2 = base + 2 AED/hr
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="clientRateMultiplier">Client Rate Multiplier (Global Default)</Label>
                    <div className="mt-1 relative">
                      <input
                        id="clientRateMultiplier"
                        type="number"
                        step="0.01"
                        min="0"
                        max="10"
                        value={form.clientRateMultiplier}
                        onChange={(e) => setForm({ ...form, clientRateMultiplier: parseFloat(e.target.value) || 1.0 })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        disabled={form.dayType === SpecialDayType.MANDATORY_OFF || form.dayType === SpecialDayType.REGULAR}
                      />
                      <div className="absolute right-3 top-2 text-sm text-gray-500">
                        {((form.clientRateMultiplier || 1) * 100).toFixed(0)}%
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      e.g., 1.10 = 110% (10% extra on client billing). Can be overridden per project.
                    </p>
                  </div>

                  {/* Client Billing Hours Rules */}
                  {(form.dayType === SpecialDayType.PREMIUM_RATE || form.dayType === SpecialDayType.OPTIONAL_OFF) && (
                    <div className="md:col-span-2 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">Client Billing Hours Rules</Label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.minBillingHours != null}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setForm({ ...form, minBillingHours: 8, billingHoursThreshold: 6, additionalHoursAboveThreshold: 2 });
                              } else {
                                setForm({ ...form, minBillingHours: null, billingHoursThreshold: null, additionalHoursAboveThreshold: null });
                              }
                            }}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span className="text-xs text-gray-600 dark:text-gray-400">Enable</span>
                        </label>
                      </div>
                      {form.minBillingHours != null && (
                        <>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Threshold (hrs)
                              </label>
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                value={form.billingHoursThreshold ?? ""}
                                onChange={(e) => setForm({ ...form, billingHoursThreshold: e.target.value ? parseFloat(e.target.value) : null })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                placeholder="e.g. 6"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Min Billing (hrs)
                              </label>
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                value={form.minBillingHours ?? ""}
                                onChange={(e) => setForm({ ...form, minBillingHours: e.target.value ? parseFloat(e.target.value) : null })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                placeholder="e.g. 8"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Extra hrs above
                              </label>
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                value={form.additionalHoursAboveThreshold ?? ""}
                                onChange={(e) => setForm({ ...form, additionalHoursAboveThreshold: e.target.value ? parseFloat(e.target.value) : null })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                placeholder="e.g. 2"
                              />
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            If worker works <strong>&le; {form.billingHoursThreshold ?? "X"} hrs</strong>: bill <strong>{form.minBillingHours ?? "Y"} hrs</strong>.
                            If worker works <strong>&gt; {form.billingHoursThreshold ?? "X"} hrs</strong>: bill <strong>actual + {form.additionalHoursAboveThreshold ?? "Z"} hrs</strong>.
                          </p>
                        </>
                      )}
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <Label htmlFor="notes">Internal Notes</Label>
                    <textarea
                      id="notes"
                      rows={2}
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      placeholder="Internal admin notes (not shown to employees)"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      id="isActive"
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                      className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                    />
                    <Label htmlFor="isActive" className="ml-2 mb-0">
                      Active
                    </Label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="isRecurring"
                      type="checkbox"
                      checked={form.isRecurring}
                      onChange={(e) =>
                        setForm({ ...form, isRecurring: e.target.checked })
                      }
                      className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                    />
                    <Label htmlFor="isRecurring" className="ml-2 mb-0">
                      Recurring Annually
                    </Label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button type="button" variant="outline" onClick={closeModal}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      createMutation.isPending || updateMutation.isPending
                    }
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? "Saving..."
                      : editingDay
                      ? "Update"
                      : "Create"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      </PermissionGuard>
    </>
  );
}

