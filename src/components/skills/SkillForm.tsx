import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { skillsApi } from "../../services/api/skillsApi";
import { Skill, CreateSkillRequest } from "../../types/skill";
import { QUERY_KEYS } from "../../lib/constants";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Select from "../form/Select";
import Button from "../ui/button/Button";

interface SkillFormProps {
  skill?: Skill;
  onClose: () => void;
}

export default function SkillForm({ skill, onClose }: SkillFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!skill;

  const [formData, setFormData] = useState<CreateSkillRequest>({
    type: skill?.type || "",
    skill: skill?.skill || "",
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateSkillRequest) => skillsApi.createSkill(data),
    onSuccess: () => {
      toast.success("Skill created successfully!");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.skills.all });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.skills.search,
      });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create skill");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateSkillRequest }) =>
      skillsApi.updateSkill(id, data),
    onSuccess: () => {
      toast.success("Skill updated successfully!");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.skills.all });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.skills.search,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.skills.detail(skill!.id),
      });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update skill");
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const skillTypeOptions = [
    { value: "White Collar", label: "White Collar" },
    { value: "Blue Collar", label: "Blue Collar" },
    { value: "Gray Collar", label: "Gray Collar" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      updateMutation.mutate({ id: skill.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="skill">
            Skill Name <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            id="skill"
            name="skill"
            value={formData.skill}
            onChange={handleChange}
            placeholder="e.g., JavaScript, English, Communication"
            required
          />
        </div>

        <div>
          <Label htmlFor="type">
            Skill Type <span className="text-red-500">*</span>
          </Label>
          <Select
            options={skillTypeOptions}
            value={formData.type}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, type: value }))
            }
            placeholder="Select skill type"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? isEditing
              ? "Updating..."
              : "Creating..."
            : isEditing
            ? "Update Skill"
            : "Create Skill"}
        </Button>
      </div>
    </form>
  );
}
