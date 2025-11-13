import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsApi } from "../services/api/projectsApi";
import { clientsApi } from "../services/api/clientsApi";
import { QUERY_KEYS } from "../lib/constants";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
import Input from "../components/form/input/InputField";
import Select from "../components/form/Select";
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
import { Project, CreateProjectRequest, ProjectStatus } from "../types/project";
import ProjectSkillsModal from "../components/projects/ProjectSkillsModal";

export default function ProjectManagement() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [form, setForm] = useState<CreateProjectRequest>({
    name: "",
    location: "",
    status: "planned",
    notes: "",
    clientId: 0,
  });
  const queryClient = useQueryClient();
  const { data: projectsData } = useQuery({
    queryKey: QUERY_KEYS.projects.all,
    queryFn: () => projectsApi.getProjects(),
  });
  const { data: clientsData } = useQuery({
    queryKey: QUERY_KEYS.clients.all,
    queryFn: () => clientsApi.getClients(),
  });

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
        status: "planned",
        notes: "",
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
      status: "planned",
      notes: "",
      clientId: 0,
    });
    setIsModalOpen(true);
  };

  const openEdit = (p: Project) => {
    setEditing(p);
    setForm({
      name: p.name || "",
      location: p.location || "",
      status: p.status || "planned",
      notes: p.notes || "",
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

  const statusOptions: { value: ProjectStatus; label: string }[] = [
    { value: "planned", label: "Planned" },
    { value: "ongoing", label: "Ongoing" },
    { value: "on_hold", label: "On Hold" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  return (
    <>
      <PageMeta
        title="Projects | ADAA Employment LLC"
        description="Manage projects"
      />
      <PageBreadcrumb pageTitle="Projects" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="mb-5 flex items-center justify-between lg:mb-7">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Projects
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              View and manage projects
            </p>
          </div>
          <Button onClick={openCreate}>+ Add Project</Button>
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
                    Status
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
                {projectsData?.data?.map((p: Project) => (
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
                      <Badge
                        size="sm"
                        color={
                          p.status === "planned"
                            ? "gray"
                            : p.status === "ongoing"
                            ? "info"
                            : p.status === "on_hold"
                            ? "warning"
                            : p.status === "completed"
                            ? "success"
                            : "error"
                        }
                      >
                        {p.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-800 dark:text-white/90">
                      {p.projectSkills && p.projectSkills.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {p.projectSkills.map((ps: any) => (
                            <Badge key={ps.id} size="sm" color="light">
                              {ps.skill?.skill}
                              {ps.sale_price && (
                                <span className="ml-1">
                                  (${Number(ps.sale_price).toFixed(2)})
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
                ))}
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
            <Label htmlFor="project-status">Status</Label>
            <Select
              options={statusOptions.map((o) => ({
                value: o.value,
                label: o.label,
              }))}
              value={form.status || "planned"}
              onChange={(v) => setForm({ ...form, status: v as ProjectStatus })}
              placeholder="Select status"
            />
          </div>
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
          <div className="md:col-span-2">
            <Label htmlFor="project-notes">Notes</Label>
            <Input
              id="project-notes"
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
