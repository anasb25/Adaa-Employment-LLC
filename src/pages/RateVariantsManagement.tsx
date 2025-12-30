import { useState, useEffect } from "react";
import { PlusIcon, PencilIcon, TrashBinIcon } from "../icons";
import { rateVariantsApi } from "../services/api/rateVariantsApi";
import { RateVariant, CreateRateVariantRequest } from "../types/rate-variant";

const RateVariantsManagement = () => {
  const [rateVariants, setRateVariants] = useState<RateVariant[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRateVariant, setEditingRateVariant] = useState<RateVariant | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<CreateRateVariantRequest>({
    name: "",
    description: "",
    displayOrder: 0,
    isActive: true,
    color: "#3b82f6",
    employeeRateMultiplier: 1.0,
    minHours: null,
    maxHours: null,
  });

  useEffect(() => {
    loadRateVariants();
  }, []);

  const loadRateVariants = async () => {
    try {
      setLoading(true);
      const data = await rateVariantsApi.getRateVariants();
      setRateVariants(data);
    } catch (error) {
      console.error("Failed to load rate variants:", error);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setForm({
      name: "",
      description: "",
      displayOrder: rateVariants.length,
      isActive: true,
      color: "#3b82f6",
      employeeRateMultiplier: 1.0,
      minHours: null,
      maxHours: null,
    });
    setEditingRateVariant(null);
    setIsModalOpen(true);
  };

  const openEdit = (variant: RateVariant) => {
    setForm({
      name: variant.name,
      description: variant.description,
      displayOrder: variant.displayOrder,
      isActive: variant.isActive,
      color: variant.color,
      employeeRateMultiplier: variant.employeeRateMultiplier,
      minHours: variant.minHours ?? null,
      maxHours: variant.maxHours ?? null,
    });
    setEditingRateVariant(variant);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRateVariant) {
        await rateVariantsApi.updateRateVariant(editingRateVariant.id, form);
      } else {
        await rateVariantsApi.createRateVariant(form);
      }
      setIsModalOpen(false);
      loadRateVariants();
    } catch (error) {
      console.error("Failed to save rate variant:", error);
      alert("Failed to save rate variant");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this rate variant?")) return;
    try {
      await rateVariantsApi.deleteRateVariant(id);
      loadRateVariants();
    } catch (error: any) {
      console.error("Failed to delete rate variant:", error);
      alert(error.response?.data?.message || "Failed to delete rate variant");
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Rate Variants
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage rate types (Regular, Overtime, Night Shift, etc.)
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="w-5 h-5" />
          Add Rate Variant
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Employee Multiplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Hour Range
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {rateVariants.map((variant) => (
                <tr key={variant.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {variant.color && (
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: variant.color }}
                        />
                      )}
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {variant.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {variant.description || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {variant.displayOrder}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {variant.employeeRateMultiplier}x
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {variant.minHours !== null && variant.minHours !== undefined
                      ? variant.maxHours !== null && variant.maxHours !== undefined
                        ? `${variant.minHours} - ${variant.maxHours} hrs`
                        : `>${variant.minHours} hrs`
                      : variant.maxHours !== null && variant.maxHours !== undefined
                      ? `<${variant.maxHours} hrs`
                      : "All hours"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        variant.isActive
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                      }`}
                    >
                      {variant.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEdit(variant)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(variant.id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      title="Delete"
                    >
                      <TrashBinIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              {editingRateVariant ? "Edit Rate Variant" : "Add Rate Variant"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={form.displayOrder}
                    onChange={(e) =>
                      setForm({ ...form, displayOrder: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Color
                  </label>
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Employee Rate Multiplier (e.g., 1.05 = 105%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.employeeRateMultiplier ?? 1.0}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        employeeRateMultiplier: parseFloat(e.target.value) || 1.0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Min Hours (leave empty for no minimum)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.minHours ?? ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          minHours: e.target.value ? parseFloat(e.target.value) : null,
                        })
                      }
                      placeholder="e.g., 10 for >10 hours"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Max Hours (leave empty for no maximum)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.maxHours ?? ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          maxHours: e.target.value ? parseFloat(e.target.value) : null,
                        })
                      }
                      placeholder="e.g., 4 for <4 hours"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label
                    htmlFor="isActive"
                    className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                  >
                    Active
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingRateVariant ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RateVariantsManagement;

