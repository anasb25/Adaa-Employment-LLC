import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { projectSkillsApi } from "../../services/api/projectSkillsApi";
import { projectSkillRatesApi } from "../../services/api/projectSkillRatesApi";
import { rateVariantsApi } from "../../services/api/rateVariantsApi";
import { skillRatesApi } from "../../services/api/skillRatesApi";
import { skillsApi } from "../../services/api/skillsApi";
import { Project } from "../../types/project";
import { Skill, ProjectSkill } from "../../types/skill";
import { RateType } from "../../types/rate-variant";
import { QUERY_KEYS } from "../../lib/constants";
import { Modal } from "../ui/ReusableModal";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import Select from "../form/Select";
import Input from "../form/input/InputField";
import Badge from "../ui/badge/Badge";
import { TrashBinIcon, PencilIcon, SettingsIcon } from "../../icons";

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
  const [showRatesModal, setShowRatesModal] = useState(false);
  const [selectedSkillForRates, setSelectedSkillForRates] = useState<number | null>(null);

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

  const openRatesModal = (skillId: number) => {
    setSelectedSkillForRates(skillId);
    setShowRatesModal(true);
  };

  return (
    <>
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
                            onClick={() => openRatesModal(ps.skillId)}
                            className="px-3 py-1 text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/20"
                          >
                            <SettingsIcon className="w-4 h-4" />
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

    {/* Rate Variants Configuration Modal */}
    {showRatesModal && selectedSkillForRates && (
      <SkillRatesConfigModal
        projectId={project.id}
        skillId={selectedSkillForRates}
        isOpen={showRatesModal}
        onClose={() => {
          setShowRatesModal(false);
          setSelectedSkillForRates(null);
        }}
      />
    )}
  </>
  );
}

// Sub-component for configuring rates
interface SkillRatesConfigModalProps {
  projectId: number;
  skillId: number;
  isOpen: boolean;
  onClose: () => void;
}

function SkillRatesConfigModal({
  projectId,
  skillId,
  isOpen,
  onClose,
}: SkillRatesConfigModalProps) {
  const queryClient = useQueryClient();
  const [rates, setRates] = useState<
    Array<{
      rateVariantId: number;
      rateType: RateType;
      rateValue: string;
      notes: string;
    }>
  >([]);

  // Fetch rate variants
  const { data: rateVariants = [] } = useQuery({
    queryKey: ["rateVariants"],
    queryFn: () => rateVariantsApi.getRateVariants(),
    enabled: isOpen,
  });

  // Fetch existing rates for this skill
  const { data: existingRates = [], refetch } = useQuery({
    queryKey: ["projectSkillRates", projectId, skillId],
    queryFn: () => projectSkillRatesApi.getSkillRates(projectId, skillId),
    enabled: isOpen,
  });

  // Fetch skill rates to use as defaults
  const { data: skillRates = [] } = useQuery({
    queryKey: ["skillRates", skillId],
    queryFn: () => skillRatesApi.getSkillRates(skillId),
    enabled: isOpen && existingRates.length === 0,
  });

  // Initialize form with existing rates or skill rates as defaults
  useEffect(() => {
    if (existingRates.length > 0) {
      // Use existing project-specific rates
      setRates(
        existingRates.map((rate: any) => ({
          rateVariantId: rate.rateVariantId,
          rateType: rate.rateType,
          rateValue: rate.rateValue.toString(),
          notes: rate.notes || "",
        }))
      );
    } else if (skillRates.length > 0) {
      // Auto-populate from skill rates (clientRateValue)
      setRates(
        skillRates.map((skillRate: any) => ({
          rateVariantId: skillRate.rateVariantId,
          rateType: skillRate.rateType,
          rateValue: skillRate.clientRateValue.toString(),
          notes: skillRate.notes || "",
        }))
      );
    } else if (rateVariants.length > 0) {
      // Fallback: empty form with base rate
      const baseRate = rateVariants.find((rv: any) => rv.isBaseRate);
      if (baseRate) {
        setRates([
          {
            rateVariantId: baseRate.id,
            rateType: RateType.FLAT,
            rateValue: "",
            notes: "",
          },
        ]);
      }
    }
  }, [existingRates, skillRates, rateVariants]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const validRates = rates.filter((r) => r.rateValue && parseFloat(r.rateValue) > 0);
      return projectSkillRatesApi.bulkCreateSkillRates(projectId, skillId, {
        rates: validRates.map((r) => ({
          rateVariantId: r.rateVariantId,
          rateType: r.rateType,
          rateValue: parseFloat(r.rateValue),
          notes: r.notes || undefined,
        })),
      });
    },
    onSuccess: () => {
      toast.success("Rates configured successfully!");
      queryClient.invalidateQueries({
        queryKey: ["projectSkillRates", projectId, skillId],
      });
      refetch();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to save rates");
    },
  });

  const handleAddRate = () => {
    const unusedVariants = rateVariants.filter(
      (rv: any) => !rates.some((r) => r.rateVariantId === rv.id)
    );
    if (unusedVariants.length > 0) {
      setRates([
        ...rates,
        {
          rateVariantId: unusedVariants[0].id,
          rateType: RateType.FLAT,
          rateValue: "",
          notes: "",
        },
      ]);
    } else {
      toast.error("All rate variants have been added");
    }
  };

  const handleRemoveRate = (index: number) => {
    setRates(rates.filter((_, i) => i !== index));
  };

  const handleRateChange = (index: number, field: string, value: any) => {
    const newRates = [...rates];
    (newRates[index] as any)[field] = value;
    setRates(newRates);
  };

  const baseRate = rates.find((r) => {
    const variant = rateVariants.find((rv: any) => rv.id === r.rateVariantId);
    return variant?.isBaseRate;
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configure Rate Variants" size="lg">
      <div className="space-y-4 p-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Auto-populated from skill rates.</strong> These client billing rates are pre-filled
            from the skill configuration but can be customized for this specific project.
          </p>
        </div>

        <div className="space-y-4">
          {rates.map((rate, index) => {
            const variant = rateVariants.find((rv: any) => rv.id === rate.rateVariantId);
            const isBase = variant?.isBaseRate;
            const availableVariants = rateVariants.filter(
              (rv: any) =>
                rv.id === rate.rateVariantId ||
                !rates.some((r) => r.rateVariantId === rv.id)
            );

            return (
              <div
                key={index}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <Label>Rate Variant</Label>
                  {!isBase && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRate(index)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400"
                    >
                      <TrashBinIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <Select
                  options={availableVariants.map((rv: any) => ({
                    value: rv.id.toString(),
                    label: rv.name,
                  }))}
                  value={rate.rateVariantId.toString()}
                  onChange={(value) =>
                    handleRateChange(index, "rateVariantId", parseInt(value))
                  }
                  disabled={isBase}
                />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Rate Type</Label>
                    <Select
                      options={[
                        { value: RateType.FLAT, label: "Flat Amount (AED)" },
                        {
                          value: RateType.MULTIPLIER,
                          label: "Multiplier of Base",
                        },
                      ].filter(opt => !isBase || opt.value === RateType.FLAT)}
                      value={rate.rateType}
                      onChange={(value) => handleRateChange(index, "rateType", value)}
                      disabled={isBase}
                    />
                  </div>

                  <div>
                    <Label>
                      {rate.rateType === RateType.FLAT ? "Amount (AED)" : "Multiplier (e.g., 1.2)"}
                    </Label>
                    <Input
                      type="number"
                      step={0.01}
                      value={rate.rateValue}
                      onChange={(e) => handleRateChange(index, "rateValue", e.target.value)}
                      placeholder={
                        rate.rateType === RateType.FLAT ? "10.00" : "1.2"
                      }
                    />
                    {rate.rateType === RateType.MULTIPLIER && baseRate && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Final: AED {(parseFloat(baseRate.rateValue || "0") * parseFloat(rate.rateValue || "0")).toFixed(2)}/hr
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Notes (Optional)</Label>
                  <Input
                    type="text"
                    value={rate.notes}
                    onChange={(e) => handleRateChange(index, "notes", e.target.value)}
                    placeholder="e.g., >10 hours, 10pm-6am"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleAddRate}
          className="w-full"
          disabled={rates.length >= rateVariants.length}
        >
          + Add Another Rate Variant
        </Button>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Saving..." : "Save Rates"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
