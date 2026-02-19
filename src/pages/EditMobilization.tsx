import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { mobilizationsApi } from "../services/api/mobilizationsApi";
import { employeesApi } from "../services/api/employeesApi";
import { projectsApi } from "../services/api/projectsApi";
import { skillsApi } from "../services/api/skillsApi";
import { MobStatus, JobStatus } from "../types/mobilization";
import Button from "../components/ui/button/Button";
import Select from "../components/form/Select";
import Label from "../components/form/Label";
import Input from "../components/form/input/InputField";
import { AngleLeftIcon } from "../icons";
import {
  MOB_STATUS_OPTIONS,
  JOB_STATUS_OPTIONS,
  getMobStatusFromJobStatus,
} from "../lib/mobilizationConstants";

export default function EditMobilization() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    employeeId: undefined as number | undefined,
    mobilizedTradeId: undefined as number | undefined,
    projectId: undefined as number | undefined,
    mobStatus: MobStatus.DEMOBILIZED,
    jobStatus: JobStatus.ACTIVE,
    actionDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  // Fetch existing mobilization
  const { data: mobilization, isLoading: isLoadingMobilization } = useQuery({
    queryKey: ["mobilization", id],
    queryFn: () => mobilizationsApi.getById(Number(id)),
    enabled: !!id,
  });

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

  // Populate form when mobilization data is loaded
  useEffect(() => {
    if (mobilization) {
      setFormData({
        employeeId: mobilization.employeeId,
        mobilizedTradeId: mobilization.mobilizedTradeId,
        projectId: mobilization.projectId || undefined,
        mobStatus: mobilization.mobStatus,
        jobStatus: mobilization.jobStatus,
        actionDate: mobilization.actionDate.split("T")[0],
        notes: mobilization.notes || "",
      });
    }
  }, [mobilization]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: any) => mobilizationsApi.update(Number(id), data),
    onSuccess: () => {
      toast.success("Mobilization updated successfully");
      queryClient.invalidateQueries({ queryKey: ["mobilizations"] });
      queryClient.invalidateQueries({ queryKey: ["daily-mobilizations"] });
      queryClient.invalidateQueries({ queryKey: ["mobilization", id] });
      navigate(-1); // Go back to previous page
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to update mobilization"
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.employeeId) {
      toast.error("Please select an employee");
      return;
    }
    if (!formData.mobilizedTradeId) {
      toast.error("Please select a trade");
      return;
    }

    updateMutation.mutate(formData);
  };

  const handleChange = (field: string, value: any) => {
    const next = { ...formData, [field]: value };
    if (field === "jobStatus" && value) {
      next.mobStatus = getMobStatusFromJobStatus(value as JobStatus);
    }
    setFormData(next);
  };

  if (isLoadingMobilization) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500 dark:text-gray-400">
          Loading mobilization...
        </div>
      </div>
    );
  }

  if (!mobilization) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Mobilization not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            startIcon={<AngleLeftIcon className="h-5 w-5" />}
            className="mb-2"
          >
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Edit Mobilization
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Update mobilization record for {mobilization.employee?.name}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Employee */}
          <div>
            <Label>Employee *</Label>
            <Select
              options={
                employees?.data?.map((emp: any) => ({
                  value: String(emp.id),
                  label: `${emp.name} (${emp.adaa_emp_code})`,
                })) || []
              }
              value={String(formData.employeeId || "")}
              onChange={(value) => handleChange("employeeId", Number(value))}
              placeholder="Select Employee"
              disabled
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Employee cannot be changed for existing mobilization
            </p>
          </div>

          {/* Mobilized Trade */}
          <div>
            <Label>Mobilized Trade *</Label>
            <Select
              options={
                skills?.data?.map((skill: any) => ({
                  value: String(skill.id),
                  label: skill.skill,
                })) || []
              }
              value={String(formData.mobilizedTradeId || "")}
              onChange={(value) =>
                handleChange("mobilizedTradeId", Number(value))
              }
              placeholder="Select Trade"
            />
          </div>

          {/* Project */}
          <div>
            <Label>Project</Label>
            <Select
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
              placeholder="No Project (Demobilized)"
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

          {/* Mob Status (read-only, derived from Job Status) */}
          <div>
            <Label>Mobilization Status</Label>
            <Select
              options={MOB_STATUS_OPTIONS}
              value={formData.mobStatus}
              onChange={() => {}}
              disabled={true}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Set automatically from Job Status
            </p>
          </div>

          {/* Action Date */}
          <div>
            <Label>Action Date *</Label>
            <Input
              type="date"
              required
              value={formData.actionDate}
              onChange={(e: any) => handleChange("actionDate", e.target.value)}
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

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Updating..." : "Update Mobilization"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
