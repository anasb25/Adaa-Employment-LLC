import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { mobilizationsApi } from "../services/api/mobilizationsApi";
import { employeesApi } from "../services/api/employeesApi";
import { projectsApi } from "../services/api/projectsApi";
import { skillsApi } from "../services/api/skillsApi";
import { MobStatus, JobStatus } from "../types/mobilization";
import Button from "../components/ui/button/Button";
import Select from "../components/form/Select";
import SearchableSelect from "../components/form/SearchableSelect";
import Label from "../components/form/Label";
import Input from "../components/form/input/InputField";
import { AngleLeftIcon, TrashBinIcon, PlusIcon } from "../icons";
import {
  MOB_STATUS_OPTIONS,
  JOB_STATUS_OPTIONS,
} from "../lib/mobilizationConstants";
import CarryForwardInfo from "../components/mobilizations/CarryForwardInfo";

interface BulkMobilizationRow {
  id: string;
  employeeId: number | null;
  mobilizedTradeId: number | null;
  projectId: number | null;
  mobStatus: string;
  jobStatus: string;
  actionDate: string;
  notes: string;
}

export default function CreateMobilization() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [isBulk, setIsBulk] = useState(false);

  // Get date from URL query parameter, or use today's date
  const dateFromUrl =
    searchParams.get("date") || new Date().toISOString().split("T")[0];

  // Single form state
  const [formData, setFormData] = useState({
    employeeId: undefined as number | undefined,
    mobilizedTradeId: undefined as number | undefined,
    projectId: undefined as number | undefined,
    mobStatus: MobStatus.DEMOBILIZED,
    jobStatus: JobStatus.ACTIVE,
    actionDate: dateFromUrl,
    notes: "",
  });

  // Bulk form state
  const [bulkRows, setBulkRows] = useState<BulkMobilizationRow[]>([
    {
      id: "1",
      employeeId: null,
      mobilizedTradeId: null,
      projectId: null,
      mobStatus: "demobilized",
      jobStatus: "on_job",
      actionDate: dateFromUrl,
      notes: "",
    },
  ]);

  // Update date when URL parameter changes
  useEffect(() => {
    if (dateFromUrl) {
      setFormData((prev) => ({ ...prev, actionDate: dateFromUrl }));
      setBulkRows((prev) =>
        prev.map((row) => ({ ...row, actionDate: dateFromUrl }))
      );
    }
  }, [dateFromUrl]);

  // Fetch data for dropdowns
  const { data: employees } = useQuery({
    queryKey: ["employees", "all"],
    queryFn: () => employeesApi.getEmployees(1, 1000),
  });

  const { data: projects } = useQuery({
    queryKey: ["projects", "all"],
    queryFn: () => projectsApi.getProjects(1, 1000),
  });

  const { data: skills } = useQuery({
    queryKey: ["skills", "all"],
    queryFn: () => skillsApi.getSkills(1, 1000),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => mobilizationsApi.create(data),
    onSuccess: () => {
      toast.success("Mobilization created successfully");
      queryClient.invalidateQueries({ queryKey: ["mobilizations"] });
      navigate("/mobilizations/daily");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to create mobilization"
      );
    },
  });

  // Bulk create mutation
  const bulkCreateMutation = useMutation({
    mutationFn: async () => {
      // Create promises for all rows
      const promises = bulkRows.map((row) => {
        if (!row.employeeId || !row.mobilizedTradeId) {
          return Promise.reject(new Error("Employee and Trade are required"));
        }
        return mobilizationsApi.create({
          employeeId: row.employeeId,
          mobilizedTradeId: row.mobilizedTradeId,
          projectId: row.projectId || undefined,
          mobStatus: row.mobStatus as MobStatus,
          jobStatus: row.jobStatus as JobStatus,
          actionDate: row.actionDate,
          notes: row.notes,
        });
      });
      return Promise.all(promises);
    },
    onSuccess: (results) => {
      toast.success(`Successfully created ${results.length} mobilization(s)`);
      queryClient.invalidateQueries({ queryKey: ["mobilizations"] });
      navigate("/mobilizations/daily");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create mobilizations");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isBulk) {
      const validRows = bulkRows.filter(
        (row) => row.employeeId && row.mobilizedTradeId
      );
      if (validRows.length === 0) {
        toast.error("Please fill in at least one complete row");
        return;
      }
      bulkCreateMutation.mutate();
    } else {
      if (!formData.employeeId) {
        toast.error("Please select an employee");
        return;
      }
      if (!formData.mobilizedTradeId) {
        toast.error("Please select a trade");
        return;
      }
      createMutation.mutate(formData);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleBulkRowChange = (
    rowId: string,
    field: keyof BulkMobilizationRow,
    value: any
  ) => {
    setBulkRows((rows) =>
      rows.map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
    );
  };

  const addBulkRow = () => {
    const newRow: BulkMobilizationRow = {
      id: Date.now().toString(),
      employeeId: null,
      mobilizedTradeId: null,
      projectId: null,
      mobStatus: "demobilized",
      jobStatus: "on_job",
      actionDate: dateFromUrl,
      notes: "",
    };
    setBulkRows([...bulkRows, newRow]);
  };

  const removeBulkRow = (rowId: string) => {
    if (bulkRows.length > 1) {
      setBulkRows((rows) => rows.filter((row) => row.id !== rowId));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            onClick={() => navigate("/mobilizations")}
            variant="ghost"
            leftIcon={<AngleLeftIcon className="h-5 w-5" />}
            className="mb-2"
          >
            Back to Mobilizations
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create Mobilization
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create a new mobilization record for employee(s)
          </p>
        </div>
      </div>

      {/* Info Panel */}
      <CarryForwardInfo variant="compact" />

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bulk/Single Toggle */}
          <div className="flex items-center space-x-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                checked={!isBulk}
                onChange={() => setIsBulk(false)}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Single Employee
              </span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                checked={isBulk}
                onChange={() => setIsBulk(true)}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Multiple Employees
              </span>
            </label>
          </div>

          {/* Bulk Create Table */}
          {isBulk ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Mobilization Entries *</Label>
                <Button
                  type="button"
                  onClick={addBulkRow}
                  size="sm"
                  leftIcon={<PlusIcon className="h-4 w-4" />}
                >
                  Add Row
                </Button>
              </div>

              <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Employee *
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Trade *
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Project
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Mob Status *
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Job Status *
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Action Date *
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Notes
                      </th>
                      <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-gray-700">
                    {bulkRows.map((row) => (
                      <tr key={row.id}>
                        <td className="px-3 py-2" style={{ minWidth: "200px" }}>
                          <SearchableSelect
                            options={
                              employees?.data?.map((emp: any) => ({
                                value: String(emp.id),
                                label: `${emp.name} (${emp.adaa_emp_code})`,
                              })) || []
                            }
                            value={String(row.employeeId || "")}
                            onChange={(value) =>
                              handleBulkRowChange(
                                row.id,
                                "employeeId",
                                value ? Number(value) : null
                              )
                            }
                            placeholder="Search employee..."
                          />
                        </td>
                        <td className="px-3 py-2" style={{ minWidth: "160px" }}>
                          <SearchableSelect
                            options={
                              skills?.data?.map((skill: any) => ({
                                value: String(skill.id),
                                label: skill.skill,
                              })) || []
                            }
                            value={String(row.mobilizedTradeId || "")}
                            onChange={(value) =>
                              handleBulkRowChange(
                                row.id,
                                "mobilizedTradeId",
                                value ? Number(value) : null
                              )
                            }
                            placeholder="Search trade..."
                          />
                        </td>
                        <td className="px-3 py-2" style={{ minWidth: "200px" }}>
                          <SearchableSelect
                            options={
                              projects?.data?.map((project: any) => ({
                                value: String(project.id),
                                label: `${project.name} - ${project.client?.name}`,
                              })) || []
                            }
                            value={String(row.projectId || "")}
                            onChange={(value) =>
                              handleBulkRowChange(
                                row.id,
                                "projectId",
                                value ? Number(value) : null
                              )
                            }
                            placeholder="Search project..."
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            className="w-full min-w-[120px] appearance-none rounded-md border border-gray-300 bg-transparent px-2 py-1.5 text-sm focus:border-brand-300 focus:outline-hidden focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                            value={row.mobStatus}
                            onChange={(e) =>
                              handleBulkRowChange(
                                row.id,
                                "mobStatus",
                                e.target.value
                              )
                            }
                          >
                            {MOB_STATUS_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <select
                            className="w-full min-w-[120px] appearance-none rounded-md border border-gray-300 bg-transparent px-2 py-1.5 text-sm focus:border-brand-300 focus:outline-hidden focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                            value={row.jobStatus}
                            onChange={(e) =>
                              handleBulkRowChange(
                                row.id,
                                "jobStatus",
                                e.target.value
                              )
                            }
                          >
                            {JOB_STATUS_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="date"
                            className="w-full min-w-[130px] appearance-none rounded-md border border-gray-300 bg-transparent px-2 py-1.5 text-sm focus:border-brand-300 focus:outline-hidden focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                            value={row.actionDate}
                            onChange={(e) =>
                              handleBulkRowChange(
                                row.id,
                                "actionDate",
                                e.target.value
                              )
                            }
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            className="w-full min-w-[120px] appearance-none rounded-md border border-gray-300 bg-transparent px-2 py-1.5 text-sm focus:border-brand-300 focus:outline-hidden focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                            value={row.notes}
                            onChange={(e) =>
                              handleBulkRowChange(
                                row.id,
                                "notes",
                                e.target.value
                              )
                            }
                            placeholder="Notes..."
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeBulkRow(row.id)}
                            disabled={bulkRows.length === 1}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <TrashBinIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Fill in the required fields (*) for each row. Empty or
                incomplete rows will be skipped.
              </p>
            </div>
          ) : (
            <>
              {/* Single Employee Form */}
              <div>
                <Label>Employee *</Label>
                <SearchableSelect
                  options={
                    employees?.data?.map((emp: any) => ({
                      value: String(emp.id),
                      label: `${emp.name} (${emp.adaa_emp_code})`,
                    })) || []
                  }
                  value={String(formData.employeeId || "")}
                  onChange={(value) =>
                    handleChange(
                      "employeeId",
                      value ? Number(value) : undefined
                    )
                  }
                  placeholder="Search employee..."
                />
              </div>

              {/* Mobilized Trade */}
              <div>
                <Label>Mobilized Trade *</Label>
                <SearchableSelect
                  options={
                    skills?.data?.map((skill: any) => ({
                      value: String(skill.id),
                      label: skill.skill,
                    })) || []
                  }
                  value={String(formData.mobilizedTradeId || "")}
                  onChange={(value) =>
                    handleChange(
                      "mobilizedTradeId",
                      value ? Number(value) : undefined
                    )
                  }
                  placeholder="Search trade..."
                />
              </div>

              {/* Project */}
              <div>
                <Label>Project</Label>
                <SearchableSelect
                  options={
                    projects?.data?.map((project: any) => ({
                      value: String(project.id),
                      label: `${project.name} - ${project.client?.name}`,
                    })) || []
                  }
                  value={String(formData.projectId || "")}
                  onChange={(value) =>
                    handleChange("projectId", value ? Number(value) : undefined)
                  }
                  placeholder="Search project..."
                />
              </div>

              {/* Mob Status */}
              <div>
                <Label>Mobilization Status *</Label>
                <Select
                  options={MOB_STATUS_OPTIONS}
                  value={formData.mobStatus}
                  onChange={(value) => handleChange("mobStatus", value)}
                />
              </div>

              {/* Job Status */}
              <div>
                <Label>Job Status *</Label>
                <Select
                  options={JOB_STATUS_OPTIONS}
                  value={formData.jobStatus}
                  onChange={(value) => handleChange("jobStatus", value)}
                />
              </div>

              {/* Action Date */}
              <div>
                <Label>Action Date *</Label>
                <Input
                  type="date"
                  required
                  value={formData.actionDate}
                  onChange={(e: any) =>
                    handleChange("actionDate", e.target.value)
                  }
                />
              </div>

              {/* Notes */}
              <div>
                <Label>Notes</Label>
                <textarea
                  rows={3}
                  className="h-auto w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  placeholder="Add any additional notes..."
                />
              </div>
            </>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/mobilizations")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isBulk ? bulkCreateMutation.isPending : createMutation.isPending
              }
            >
              {isBulk
                ? bulkCreateMutation.isPending
                  ? "Creating..."
                  : `Create ${bulkRows.length} Mobilization(s)`
                : createMutation.isPending
                ? "Creating..."
                : "Create Mobilization"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
