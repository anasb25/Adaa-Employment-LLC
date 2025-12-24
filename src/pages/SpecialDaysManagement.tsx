import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { specialDaysApi } from "../services/api/specialDaysApi";
import { SpecialDay, CreateSpecialDayRequest } from "../types/special-day";
import Button from "../components/ui/button/Button";
import Label from "../components/form/Label";
import { PlusIcon, PencilIcon, TrashBinIcon } from "../icons";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";

export default function SpecialDaysManagement() {
  const queryClient = useQueryClient();
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

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this special day?")) {
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
            <Button onClick={openCreate} startIcon={<PlusIcon />}>
              Add Special Day
            </Button>
          </div>

          {/* Filters */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="filterCategory">Category</Label>
              <select
                id="filterCategory"
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
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
                      Start Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      End Date
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {new Date(day.startDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {day.endDate
                          ? new Date(day.endDate).toLocaleDateString()
                          : "-"}
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
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div
              className="fixed inset-0 bg-black opacity-30"
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
    </>
  );
}

