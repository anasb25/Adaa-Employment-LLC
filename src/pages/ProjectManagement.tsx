import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsApi } from "../services/api/projectsApi";
import { clientsApi } from "../services/api/clientsApi";
import { specialDaysApi } from "../services/api/specialDaysApi";
import { rateVariantsApi } from "../services/api/rateVariantsApi";
import { QUERY_KEYS } from "../lib/constants";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
import Input from "../components/form/input/InputField";
import Select from "../components/form/Select";
import MultiSelect from "../components/form/MultiSelect";
import Label from "../components/form/Label";
import Badge from "../components/ui/badge/Badge";
import { Modal } from "../components/ui/ReusableModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { toast } from "sonner";
import {
  Project,
  CreateProjectRequest,
  ProjectFAT,
  ProjectSpecialDayRateRequest,
  ProjectRateVariantRateRequest,
} from "../types/project";
import ProjectSkillsModal from "../components/projects/ProjectSkillsModal";
import { AlertIcon as SearchIcon, PlusIcon, TrashBinIcon } from "../icons";
import { useSearch } from "../hooks/useDebounce";

export default function ProjectManagement() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [form, setForm] = useState<CreateProjectRequest>({
    name: "",
    location: "",
    notes: "",
    fat: undefined,
    offDays: [],
    offDayMultiplier: 1.0,
    specialDayRates: [],
    rateVariantRates: [],
    clientId: 0,
  });
  const queryClient = useQueryClient();

  // Search hook
  const { searchValue, debouncedSearchValue, handleSearchChange, clearSearch } =
    useSearch("");

  const { data: projectsData } = useQuery({
    queryKey: QUERY_KEYS.projects.all,
    queryFn: () => projectsApi.getProjects(),
  });
  const { data: clientsData } = useQuery({
    queryKey: QUERY_KEYS.clients.all,
    queryFn: () => clientsApi.getClients(),
  });

  const { data: specialDaysData } = useQuery({
    queryKey: ["specialDays", "all"],
    queryFn: () => specialDaysApi.getSpecialDays(),
  });

  const { data: rateVariantsData } = useQuery({
    queryKey: ["rateVariants", "all"],
    queryFn: () => rateVariantsApi.getRateVariants(),
  });

  // Filter projects based on search
  const filteredProjects = useMemo(() => {
    if (!projectsData?.data) return [];
    if (!debouncedSearchValue) return projectsData.data;

    const searchLower = debouncedSearchValue.toLowerCase();
    return projectsData.data.filter((project: Project) => {
      const clientName =
        clientsData?.data?.find((c: any) => c.id === project.clientId)?.name ||
        "";
      return (
        project.name?.toLowerCase().includes(searchLower) ||
        project.location?.toLowerCase().includes(searchLower) ||
        clientName.toLowerCase().includes(searchLower) ||
        project.notes?.toLowerCase().includes(searchLower) ||
        project.fat?.toLowerCase().includes(searchLower)
      );
    });
  }, [projectsData?.data, debouncedSearchValue, clientsData?.data]);

  const createMutation = useMutation({
    mutationFn: (data: CreateProjectRequest) => projectsApi.createProject(data),
    onSuccess: () => {
      toast.success("Project saved");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects.all });
      setIsModalOpen(false);
      setEditing(null);
      setForm({
        name: "",
        location: "",
        notes: "",
        fat: undefined,
        offDays: [],
        offDayMultiplier: 1.0,
        specialDayRates: [],
        clientId: 0,
      });
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message || "Failed to save project");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateProjectRequest }) =>
      projectsApi.updateProject(id, data),
    onSuccess: () => {
      toast.success("Project updated");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects.all });
      setIsModalOpen(false);
      setEditing(null);
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message || "Failed to update project");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => projectsApi.deleteProject(id),
    onSuccess: () => {
      toast.success("Project deleted");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects.all });
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message || "Failed to delete project");
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: "",
      location: "",
      notes: "",
      fat: undefined,
      offDays: [],
      offDayMultiplier: 1.0,
      specialDayRates: [],
      rateVariantRates: [],
      clientId: 0,
    });
    setIsModalOpen(true);
  };

  const openEdit = (p: Project) => {
    setEditing(p);
    setForm({
      name: p.name || "",
      location: p.location || "",
      notes: p.notes || "",
      fat: p.fat,
      offDays: p.offDays || [],
      offDayMultiplier: p.offDayMultiplier || 1.0,
      specialDayRates:
        p.specialDayRates?.map((rate) => ({
          specialDayId: rate.specialDayId,
          clientRateMultiplier: rate.clientRateMultiplier,
        })) || [],
      rateVariantRates:
        p.rateVariantRates?.map((rate) => ({
          rateVariantId: rate.rateVariantId,
          clientRateMultiplier: rate.clientRateMultiplier,
        })) || [],
      clientId: p.clientId,
    });
    setIsModalOpen(true);
  };

  const save = () => {
    if (!form.name?.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!form.clientId) {
      toast.error("Client is required");
      return;
    }
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const remove = (id: number) => {
    if (window.confirm("Delete this project?")) {
      deleteMutation.mutate(id);
    }
  };

  const fatOptions: { value: ProjectFAT; label: string }[] = [
    { value: "ADAA", label: "ADAA" },
    { value: "CLIENT", label: "CLIENT" },
  ];

  const daysOfWeekOptions = [
    { value: "Sunday", text: "Sunday" },
    { value: "Monday", text: "Monday" },
    { value: "Tuesday", text: "Tuesday" },
    { value: "Wednesday", text: "Wednesday" },
    { value: "Thursday", text: "Thursday" },
    { value: "Friday", text: "Friday" },
    { value: "Saturday", text: "Saturday" },
  ];

  const addSpecialDayRate = () => {
    setForm({
      ...form,
      specialDayRates: [
        ...(form.specialDayRates || []),
        { specialDayId: 0, clientRateMultiplier: 1.0 },
      ],
    });
  };

  const updateSpecialDayRate = (
    index: number,
    field: keyof ProjectSpecialDayRateRequest,
    value: any
  ) => {
    const updated = [...(form.specialDayRates || [])];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, specialDayRates: updated });
  };

  const removeSpecialDayRate = (index: number) => {
    const updated = [...(form.specialDayRates || [])];
    updated.splice(index, 1);
    setForm({ ...form, specialDayRates: updated });
  };

  const addRateVariantRate = () => {
    setForm({
      ...form,
      rateVariantRates: [
        ...(form.rateVariantRates || []),
        { rateVariantId: 0, clientRateMultiplier: 1.0 },
      ],
    });
  };

  const updateRateVariantRate = (
    index: number,
    field: keyof ProjectRateVariantRateRequest,
    value: any
  ) => {
    const updated = [...(form.rateVariantRates || [])];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, rateVariantRates: updated });
  };

  const removeRateVariantRate = (index: number) => {
    const updated = [...(form.rateVariantRates || [])];
    updated.splice(index, 1);
    setForm({ ...form, rateVariantRates: updated });
  };

  return (
    <>
      <PageMeta
        title="Projects | ADAA Employment LLC"
        description="Manage projects"
      />
      <PageBreadcrumb pageTitle="Projects" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        {/* Header with Search Bar and Actions */}
        <div className="mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 lg:mb-7">
          <div className="flex items-center gap-4 flex-1 w-full sm:w-auto">
            <div className="relative flex-1 max-w-md">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search projects by name, location, client, or FAT..."
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            {searchValue && (
              <Button onClick={clearSearch} variant="outline" size="sm">
                Clear
              </Button>
            )}
          </div>

          <Button onClick={openCreate} startIcon={<PlusIcon />}>
            Add Project
          </Button>
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
                    Client
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 text-theme-xs text-gray-500 text-start"
                  >
                    Location
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 text-theme-xs text-gray-500 text-start"
                  >
                    FAT
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 text-theme-xs text-gray-500 text-start"
                  >
                    Off Days
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
                {filteredProjects.length === 0 && searchValue ? (
                  <TableRow>
                    <TableCell colSpan={8} className="px-5 py-8 text-center">
                      <div className="text-gray-500 dark:text-gray-400">
                        No projects found matching "{searchValue}"
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProjects.map((p: Project) => (
                    <TableRow key={p.id}>
                      <TableCell className="px-5 py-4 text-gray-800 dark:text-white/90">
                        {p.name}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-800 dark:text-white/90">
                        {clientsData?.data?.find(
                          (c) => (c as any).id === p.clientId
                        )?.name || "-"}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-800 dark:text-white/90">
                        {p.location || "-"}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-800 dark:text-white/90">
                        {p.fat ? (
                          <Badge size="sm" color="light">
                            {p.fat}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">—</span>
                        )}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-800 dark:text-white/90">
                        {p.offDays && p.offDays.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {p.offDays.map((day: string, idx: number) => (
                              <Badge key={idx} size="sm" color="light">
                                {day}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">—</span>
                        )}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-800 dark:text-white/90">
                        {p.projectSkills && p.projectSkills.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {p.projectSkills.map((ps: any) => (
                              <Badge key={ps.id} size="sm" color="light">
                                {ps.skill?.skill}
                                {ps.sale_price && (
                                  <span className="ml-1">
                                    (AED {Number(ps.sale_price).toFixed(2)})
                                  </span>
                                )}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-800 dark:text-white/90">
                        {p.notes || "-"}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-800 dark:text-white/90">
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => openEdit(p)}>
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedProject(p);
                              setIsSkillsModalOpen(true);
                            }}
                          >
                            Manage Skills
                          </Button>
                          <Button
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                            onClick={() => remove(p.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editing ? "Edit Project" : "Add Project"}
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2">
          <div>
            <Label htmlFor="project-client">Client</Label>
            <Select
              options={(clientsData?.data || []).map((c: any) => ({
                value: String(c.id),
                label: c.name,
              }))}
              value={form.clientId ? String(form.clientId) : ""}
              onChange={(v) => setForm({ ...form, clientId: Number(v) })}
              placeholder="Select client"
            />
          </div>
          <div>
            <Label htmlFor="project-name">Name</Label>
            <Input
              id="project-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="project-location">Location</Label>
            <Input
              id="project-location"
              value={form.location || ""}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="project-fat">FAT</Label>
            <Select
              options={fatOptions.map((o) => ({
                value: o.value,
                label: o.label,
              }))}
              value={form.fat || ""}
              onChange={(v) => setForm({ ...form, fat: v as ProjectFAT | undefined })}
              placeholder="Select FAT"
            />
          </div>
          <div className="md:col-span-2">
            <MultiSelect
              label="Off Days"
              options={daysOfWeekOptions}
              value={form.offDays || []}
              onChange={(days) => setForm({ ...form, offDays: days })}
              placeholder="Select off days"
            />
          </div>
          <div>
            <Label htmlFor="project-off-day-multiplier">
              Off Day Multiplier (Client Rate)
            </Label>
            <Input
              id="project-off-day-multiplier"
              type="number"
              step="0.01"
              min="0"
              value={form.offDayMultiplier || 1.0}
              onChange={(e) =>
                setForm({
                  ...form,
                  offDayMultiplier: parseFloat(e.target.value) || 1.0,
                })
              }
              placeholder="1.0"
            />
            <p className="text-xs text-gray-500 mt-1">
              Multiplier for client billing when employee works on project off
              days (e.g., 1.25 = 125%)
            </p>
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="project-notes">Notes</Label>
            <Input
              id="project-notes"
              value={form.notes || ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <Label>Special Day Rates (Client Multipliers)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSpecialDayRate}
                startIcon={<PlusIcon />}
              >
                Add Rate
              </Button>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Set project-specific client rate multipliers for special days.
              Employee multipliers remain global.
            </p>
            {form.specialDayRates && form.specialDayRates.length > 0 && (
              <div className="space-y-3 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                {form.specialDayRates.map((rate, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end"
                  >
                    <div>
                      <Label>Special Day</Label>
                      <Select
                        options={(specialDaysData || []).map((sd) => ({
                          value: String(sd.id),
                          label: sd.name,
                        }))}
                        value={
                          rate.specialDayId ? String(rate.specialDayId) : ""
                        }
                        onChange={(v) =>
                          updateSpecialDayRate(
                            index,
                            "specialDayId",
                            Number(v)
                          )
                        }
                        placeholder="Select special day"
                      />
                    </div>
                    <div>
                      <Label>Client Multiplier</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={rate.clientRateMultiplier || 1.0}
                        onChange={(e) =>
                          updateSpecialDayRate(
                            index,
                            "clientRateMultiplier",
                            parseFloat(e.target.value) || 1.0
                          )
                        }
                        placeholder="1.0"
                      />
                    </div>
                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => removeSpecialDayRate(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <TrashBinIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {(!form.specialDayRates ||
              form.specialDayRates.length === 0) && (
              <div className="text-sm text-gray-500 italic p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                No special day rates configured. Click "Add Rate" to add one.
              </div>
            )}
          </div>
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <Label>Rate Variant Rates (Client Multipliers)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRateVariantRate}
                startIcon={<PlusIcon />}
              >
                Add Rate
              </Button>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Set project-specific client rate multipliers for rate variants.
              Employee multipliers remain global.
            </p>
            {form.rateVariantRates && form.rateVariantRates.length > 0 && (
              <div className="space-y-3 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                {form.rateVariantRates.map((rate, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end"
                  >
                    <div>
                      <Label>Rate Variant</Label>
                      <Select
                        options={(rateVariantsData || []).map((rv) => ({
                          value: String(rv.id),
                          label: rv.name,
                        }))}
                        value={
                          rate.rateVariantId ? String(rate.rateVariantId) : ""
                        }
                        onChange={(v) =>
                          updateRateVariantRate(
                            index,
                            "rateVariantId",
                            Number(v)
                          )
                        }
                        placeholder="Select rate variant"
                      />
                    </div>
                    <div>
                      <Label>Client Multiplier</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={rate.clientRateMultiplier || 1.0}
                        onChange={(e) =>
                          updateRateVariantRate(
                            index,
                            "clientRateMultiplier",
                            parseFloat(e.target.value) || 1.0
                          )
                        }
                        placeholder="1.0"
                      />
                    </div>
                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => removeRateVariantRate(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <TrashBinIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {(!form.rateVariantRates ||
              form.rateVariantRates.length === 0) && (
              <div className="text-sm text-gray-500 italic p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                No rate variant rates configured. Click "Add Rate" to add one.
              </div>
            )}
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

      {/* Project Skills Modal */}
      {selectedProject && (
        <ProjectSkillsModal
          project={selectedProject}
          isOpen={isSkillsModalOpen}
          onClose={() => {
            setIsSkillsModalOpen(false);
            setSelectedProject(null);
          }}
        />
      )}
    </>
  );
}
