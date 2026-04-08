import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { employeeSkillsApi } from "../../services/api/employeeSkillsApi";
import { skillsApi } from "../../services/api/skillsApi";
import { QUERY_KEYS } from "../../lib/constants";
import { Employee, EmployeeSkill } from "../../types/employee";
import { Skill } from "../../types/skill";
import Badge from "../ui/badge/Badge";
import Button from "../ui/button/Button";
import Select from "../form/Select";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { TrashBinIcon } from "../../icons";

interface EmployeeSkillManagerProps {
  employeeId: number;
  initialSkills?: EmployeeSkill[];
}

export default function EmployeeSkillManager({
  employeeId,
  initialSkills = [],
}: EmployeeSkillManagerProps) {
  const queryClient = useQueryClient();
  const [selectedSkillId, setSelectedSkillId] = useState<string>("");
  const [rating, setRating] = useState<string>("0");

  // Fetch all available skills
  const { data: allSkills = [] } = useQuery({
    queryKey: QUERY_KEYS.skills.all,
    queryFn: () => skillsApi.getSkills(),
  });

  // Fetch employee skills
  const { data: employeeSkills = [] } = useQuery({
    queryKey: QUERY_KEYS.employees.skills(employeeId),
    queryFn: () => employeeSkillsApi.getEmployeeSkills(employeeId),
    initialData: initialSkills,
  });

  // Assign skill mutation
  const assignMutation = useMutation({
    mutationFn: ({ skillId, rating }: { skillId: number; rating: number }) =>
      employeeSkillsApi.assignSkill(employeeId, { skillId, rating }),
    onSuccess: () => {
      toast.success("Skill assigned successfully!");
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.employees.skills(employeeId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.employees.detail(employeeId),
      });
      setSelectedSkillId("");
      setRating("0");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to assign skill"
      );
    },
  });

  // Update rating mutation
  const updateRatingMutation = useMutation({
    mutationFn: ({ skillId, rating }: { skillId: number; rating: number }) =>
      employeeSkillsApi.updateSkillRating(employeeId, skillId, { rating }),
    onSuccess: () => {
      toast.success("Skill rating updated successfully!");
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.employees.skills(employeeId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.employees.detail(employeeId),
      });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to update rating"
      );
    },
  });

  // Remove skill mutation
  const removeMutation = useMutation({
    mutationFn: (skillId: number) =>
      employeeSkillsApi.removeSkill(employeeId, skillId),
    onSuccess: () => {
      toast.success("Skill removed successfully!");
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.employees.skills(employeeId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.employees.detail(employeeId),
      });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to remove skill"
      );
    },
  });

  // Get skills that are not yet assigned to this employee
  const availableSkills = allSkills.filter(
    (skill) => !employeeSkills.some((es) => es.skillId === skill.id)
  );

  const skillOptions = availableSkills.map((skill) => ({
    value: skill.id.toString(),
    label: `${skill.type} - ${skill.skill}`,
  }));

  const handleAssignSkill = () => {
    if (!selectedSkillId) {
      toast.error("Please select a skill");
      return;
    }
    assignMutation.mutate({
      skillId: parseInt(selectedSkillId),
      rating: parseInt(rating) || 0,
    });
  };

  const handleUpdateRating = (skillId: number, currentRating: number) => {
    const newRating = prompt(
      `Enter new rating (0-10):`,
      currentRating.toString()
    );
    if (newRating !== null) {
      const ratingNum = parseInt(newRating);
      if (isNaN(ratingNum) || ratingNum < 0 || ratingNum > 10) {
        toast.error("Rating must be between 0 and 10");
        return;
      }
      updateRatingMutation.mutate({ skillId, rating: ratingNum });
    }
  };

  const handleRemoveSkill = (skillId: number, skillName: string) => {
    if (window.confirm(`Remove "${skillName}" from this employee?`)) {
      removeMutation.mutate(skillId);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Employee Skills
        </h3>

        {/* Assign New Skill */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <div>
            <Label htmlFor="skill-select">Select Skill</Label>
            <Select
              options={skillOptions}
              placeholder="Choose a skill to assign"
              value={selectedSkillId}
              onChange={setSelectedSkillId}
            />
          </div>
          <div>
            <Label htmlFor="rating">Rating (0-10)</Label>
            <Input
              type="number"
              id="rating"
              min="0"
              max="10"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={handleAssignSkill}
              disabled={assignMutation.isPending || !selectedSkillId}
              className="w-full"
            >
              {assignMutation.isPending ? "Assigning..." : "Assign Skill"}
            </Button>
          </div>
        </div>

        {/* Assigned Skills List */}
        <div className="space-y-2">
          {employeeSkills.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No skills assigned yet. Assign skills using the form above.
            </p>
          ) : (
            employeeSkills.filter((es) => es?.skill).map((employeeSkill) => (
              <div
                key={employeeSkill.id}
                className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Badge size="sm" color="info">
                    {employeeSkill.skill?.type ?? "N/A"}
                  </Badge>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {employeeSkill.skill?.skill ?? "Unknown Skill"}
                  </span>
                  <Badge size="sm" color="primary">
                    Rating: {employeeSkill.rating}/10
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleUpdateRating(
                        employeeSkill.skillId,
                        employeeSkill.rating
                      )
                    }
                    disabled={updateRatingMutation.isPending}
                    className="px-3 py-1 text-xs"
                  >
                    Update Rating
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleRemoveSkill(
                        employeeSkill.skillId,
                        `${employeeSkill.skill?.type ?? "N/A"} - ${employeeSkill.skill?.skill ?? "Unknown"}`
                      )
                    }
                    disabled={
                      removeMutation.isPending &&
                      removeMutation.variables === employeeSkill.skillId
                    }
                    className="px-3 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                  >
                    <TrashBinIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

