import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { projectSkillsApi } from "../../services/api/projectSkillsApi";
import { skillsApi } from "../../services/api/skillsApi";
import { Project } from "../../types/project";
import { Skill, ProjectSkill } from "../../types/skill";
import { QUERY_KEYS } from "../../lib/constants";
import { Modal } from "../ui/ReusableModal";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import Select from "../form/Select";
import Input from "../form/input/InputField";
import Badge from "../ui/badge/Badge";
import { TrashBinIcon, PencilIcon } from "../../icons";

interface ProjectSkillsModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProjectSkillsModal({
  project,
  isOpen,
  onClose,
}: ProjectSkillsModalProps) {
  const queryClient = useQueryClient();
  const [selectedSkillId, setSelectedSkillId] = useState<string>("");
  const [salePrice, setSalePrice] = useState<string>("");
  const [editingSkillId, setEditingSkillId] = useState<number | null>(null);
  const [editingSalePrice, setEditingSalePrice] = useState<string>("");

  // Fetch all skills
  const { data: allSkillsData } = useQuery({
    queryKey: QUERY_KEYS.skills.all,
    queryFn: () => skillsApi.getSkills(),
  });

  // Fetch project skills
  const {
    data: projectSkills = [],
    refetch: refetchProjectSkills,
    isLoading: isLoadingSkills,
    isFetching: isFetchingSkills,
  } = useQuery({
    queryKey: ["projectSkills", project.id],
    queryFn: async () => {
      try {
        return await projectSkillsApi.getProjectSkills(project.id);
      } catch (error) {
        console.error("Error fetching project skills:", error);
        return [];
      }
    },
    enabled: isOpen,
    refetchOnMount: true,
  });

  // Refetch when modal opens
  useEffect(() => {
    if (isOpen) {
      refetchProjectSkills();
    }
  }, [isOpen, refetchProjectSkills]);

  const allSkills = allSkillsData?.data || [];

  // Auto-fill sale price from selected skill
  useEffect(() => {
    if (selectedSkillId) {
      const selectedSkill = allSkills.find(
        (s: Skill) => s.id === parseInt(selectedSkillId)
      );
      if (selectedSkill && selectedSkill.sale_price !== undefined) {
        setSalePrice(selectedSkill.sale_price?.toString());
      }
    }
  }, [selectedSkillId, allSkills]);

  // Assign skill mutation
  const assignSkillMutation = useMutation({
    mutationFn: (data: { skillId: number; sale_price?: number }) =>
      projectSkillsApi.assignSkillToProject(project.id, data),
    onSuccess: () => {
      toast.success("Skill assigned to project successfully!");
      queryClient.invalidateQueries({
        queryKey: ["projectSkills", project.id],
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.projects.all,
      });
      setSelectedSkillId("");
      setSalePrice("");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to assign skill to project"
      );
    },
  });

  // Update sale price mutation
  const updateSalePriceMutation = useMutation({
    mutationFn: ({
      skillId,
      sale_price,
    }: {
      skillId: number;
      sale_price: number;
    }) => projectSkillsApi.updateSalePrice(project.id, skillId, { sale_price }),
    onSuccess: () => {
      toast.success("Sale price updated successfully!");
      queryClient.invalidateQueries({
        queryKey: ["projectSkills", project.id],
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.projects.all,
      });
      setEditingSkillId(null);
      setEditingSalePrice("");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to update sale price"
      );
    },
  });

  // Remove skill mutation
  const removeSkillMutation = useMutation({
    mutationFn: (skillId: number) =>
      projectSkillsApi.removeSkillFromProject(project.id, skillId),
    onSuccess: () => {
      toast.success("Skill removed from project!");
      queryClient.invalidateQueries({
        queryKey: ["projectSkills", project.id],
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.projects.all,
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to remove skill");
    },
  });

  // Get available skills (not already assigned)
  const availableSkills = allSkills.filter(
    (skill: Skill) =>
      !projectSkills.some((ps: ProjectSkill) => ps.skillId === skill.id)
  );

  const skillOptions = availableSkills.map((skill: Skill) => ({
    value: skill.id.toString(),
    label: `${skill.skillType?.type || "Unknown"} - ${skill.skill}`,
  }));

  const handleAssignSkill = () => {
    if (!selectedSkillId) {
      toast.error("Please select a skill");
      return;
    }
    const salePriceNum = parseFloat(salePrice) || undefined;

    assignSkillMutation.mutate({
      skillId: parseInt(selectedSkillId),
      sale_price: salePriceNum,
    });
  };

  const handleStartEdit = (skillId: number, currentSalePrice?: number) => {
    setEditingSkillId(skillId);
    setEditingSalePrice(
      currentSalePrice !== undefined && currentSalePrice !== null
        ? currentSalePrice.toString()
        : ""
    );
  };

  const handleSaveEdit = () => {
    if (editingSkillId === null) return;
    const salePriceNum = editingSalePrice
      ? parseFloat(editingSalePrice)
      : undefined;
    if (salePriceNum === undefined || isNaN(salePriceNum)) {
      toast.error("Please enter a valid sale price");
      return;
    }
    updateSalePriceMutation.mutate({
      skillId: editingSkillId,
      sale_price: salePriceNum,
    });
  };

  const handleCancelEdit = () => {
    setEditingSkillId(null);
    setEditingSalePrice("");
  };

  const handleRemoveSkill = (skillId: number, skillName: string) => {
    if (window.confirm(`Remove "${skillName}" from this project?`)) {
      removeSkillMutation.mutate(skillId);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Manage Skills - ${project.name}`}
      size="lg"
    >
      <div className="space-y-6 p-6">
        {/* Assign New Skill */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Assign New Skill
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="skill-select">Select Skill</Label>
              <Select
                options={skillOptions}
                placeholder="Choose a skill"
                value={selectedSkillId}
                onChange={setSelectedSkillId}
              />
            </div>
            <div>
              <Label htmlFor="sale_price">Sale Price (Optional)</Label>
              <Input
                type="number"
                id="sale_price"
                value={salePrice || ""}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="Auto-filled from skill"
              />
            </div>
          </div>
          <div className="mt-4">
            <Button
              type="button"
              onClick={handleAssignSkill}
              disabled={assignSkillMutation.isPending || !selectedSkillId}
              className="w-full"
            >
              {assignSkillMutation.isPending ? "Assigning..." : "Assign Skill"}
            </Button>
          </div>
        </div>

        {/* Assigned Skills List */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Assigned Skills ({projectSkills.length})
          </h4>
          {isLoadingSkills || isFetchingSkills ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading skills...
            </p>
          ) : projectSkills.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No skills assigned yet. Add skills to define the project
              requirements.
            </p>
          ) : (
            <div className="space-y-2">
              {projectSkills.map((ps: ProjectSkill) => {
                const isCurrentlyEditing = editingSkillId === ps.skillId;
                return (
                  <div
                    key={ps.id}
                    className={`p-3 bg-white dark:bg-gray-800 border rounded-lg ${
                      isCurrentlyEditing
                        ? "border-blue-300 dark:border-blue-700"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    {isCurrentlyEditing ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 mb-3">
                          <Badge size="sm" color="info">
                            {ps.skill?.skillType?.type || "N/A"}
                          </Badge>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {ps.skill?.skill || "Unknown"}
                          </span>
                        </div>
                        <div>
                          <Label htmlFor={`edit-sale-price-${ps.skillId}`}>
                            Sale Price
                          </Label>
                          <Input
                            type="number"
                            id={`edit-sale-price-${ps.skillId}`}
                            value={editingSalePrice || ""}
                            onChange={(e) =>
                              setEditingSalePrice(e.target.value)
                            }
                            placeholder="Enter sale price"
                            min="0"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            onClick={handleSaveEdit}
                            disabled={updateSalePriceMutation.isPending}
                            size="sm"
                            className="flex-1"
                          >
                            {updateSalePriceMutation.isPending
                              ? "Saving..."
                              : "Save"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancelEdit}
                            disabled={updateSalePriceMutation.isPending}
                            size="sm"
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <Badge size="sm" color="info">
                            {ps.skill?.skillType?.type || "N/A"}
                          </Badge>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {ps.skill?.skill || "Unknown"}
                          </span>
                          {ps.sale_price !== undefined &&
                            ps.sale_price !== null && (
                              <Badge size="sm" color="success">
                                ${Number(ps.sale_price).toFixed(2)}
                              </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleStartEdit(ps.skillId, ps.sale_price)
                            }
                            disabled={updateSalePriceMutation.isPending}
                            className="px-3 py-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleRemoveSkill(
                                ps.skillId,
                                `${ps.skill?.skillType?.type || "N/A"} - ${
                                  ps.skill?.skill || "Unknown"
                                }`
                              )
                            }
                            disabled={removeSkillMutation.isPending}
                            className="px-3 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                          >
                            <TrashBinIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end p-4 border-t border-gray-200 dark:border-gray-700">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
}
