import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { employeesApi } from "../../services/api/employeesApi";
import { employeeSkillsApi } from "../../services/api/employeeSkillsApi";
import { skillsApi } from "../../services/api/skillsApi";
import {
  Employee,
  CreateEmployeeRequest,
  EmployeeStatus,
} from "../../types/employee";
import { Skill, EmployeeSkill } from "../../types/skill";
import { QUERY_KEYS } from "../../lib/constants";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Select from "../form/Select";
import DatePicker from "../form/date-picker";
import Button from "../ui/button/Button";
import Badge from "../ui/badge/Badge";
import { TrashBinIcon } from "../../icons";

interface EmployeeFormProps {
  employee?: Employee;
  onClose: () => void;
}

interface PendingSkill {
  skillId: number;
  rating: number;
  skill: Skill;
}

export default function EmployeeForm({ employee, onClose }: EmployeeFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!employee;
  const [selectedSkillId, setSelectedSkillId] = useState<string>("");
  const [rating, setRating] = useState<string>("0");
  const [pendingSkills, setPendingSkills] = useState<PendingSkill[]>([]);

  const [formData, setFormData] = useState<CreateEmployeeRequest>({
    adaa_emp_code: employee?.adaa_emp_code || "",
    name: employee?.name || "",
    dob: employee?.dob || "",
    pp_no: employee?.pp_no || "",
    pp_expiry: employee?.pp_expiry || "",
    nationality: employee?.nationality || "",
    emirates_id: employee?.emirates_id || "",
    emirates_id_expiry: employee?.emirates_id_expiry || "",
    visa_expiry: employee?.visa_expiry || "",
    work_permit_no: employee?.work_permit_no || "",
    work_permit_expiry: employee?.work_permit_expiry || "",
    personal_code: employee?.personal_code || "",
    contact_no: employee?.contact_no || "",
    status: employee?.status || EmployeeStatus.ACTIVE,
    date_of_joining: employee?.date_of_joining || "",
    date_of_arrival: employee?.date_of_arrival || "",
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateEmployeeRequest) =>
      employeesApi.createEmployee(data),
    onSuccess: async (createdEmployee) => {
      // Assign all pending skills to the newly created employee
      if (pendingSkills.length > 0 && createdEmployee.id) {
        try {
          await Promise.all(
            pendingSkills.map((pendingSkill) =>
              employeeSkillsApi.assignSkill(createdEmployee.id, {
                skillId: pendingSkill.skillId,
                rating: pendingSkill.rating,
              })
            )
          );
          toast.success(
            `Employee created successfully with ${pendingSkills.length} skill(s)!`
          );
        } catch (error: any) {
          toast.error(
            "Employee created but some skills failed to assign: " +
              (error.response?.data?.message || error.message)
          );
        }
      } else {
        toast.success("Employee created successfully!");
      }
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.employees.all });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.employees.search,
      });
      if (createdEmployee.id) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.employees.skills(createdEmployee.id),
        });
      }
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create employee");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateEmployeeRequest }) =>
      employeesApi.updateEmployee(id, data),
    onSuccess: () => {
      toast.success("Employee updated successfully!");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.employees.all });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.employees.search,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.employees.detail(employee!.id),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.employees.skills(employee!.id),
      });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update employee");
    },
  });

  // Fetch all available skills (always enabled)
  const { data: allSkillsData } = useQuery({
    queryKey: QUERY_KEYS.skills.all,
    queryFn: () => skillsApi.getSkills(),
  });

  const allSkills = allSkillsData?.data || [];

  // Fetch employee skills (only when editing)
  const { data: employeeSkills = [] } = useQuery({
    queryKey: employee ? QUERY_KEYS.employees.skills(employee.id) : ["empty"],
    queryFn: () =>
      employee ? employeeSkillsApi.getEmployeeSkills(employee.id) : [],
    enabled: !!employee,
    initialData: employee?.employeeSkills || [],
  });

  // Assign skill mutation
  const assignSkillMutation = useMutation({
    mutationFn: ({ skillId, rating }: { skillId: number; rating: number }) =>
      employee
        ? employeeSkillsApi.assignSkill(employee.id, { skillId, rating })
        : Promise.reject("Employee not created yet"),
    onSuccess: () => {
      toast.success("Skill assigned successfully!");
      if (employee) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.employees.skills(employee.id),
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.employees.detail(employee.id),
        });
      }
      setSelectedSkillId("");
      setRating("0");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to assign skill");
    },
  });

  // Update rating mutation
  const updateRatingMutation = useMutation({
    mutationFn: ({ skillId, rating }: { skillId: number; rating: number }) =>
      employee
        ? employeeSkillsApi.updateSkillRating(employee.id, skillId, { rating })
        : Promise.reject("Employee not found"),
    onSuccess: () => {
      toast.success("Skill rating updated successfully!");
      if (employee) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.employees.skills(employee.id),
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.employees.detail(employee.id),
        });
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update rating");
    },
  });

  // Remove skill mutation
  const removeSkillMutation = useMutation({
    mutationFn: (skillId: number) =>
      employee
        ? employeeSkillsApi.removeSkill(employee.id, skillId)
        : Promise.reject("Employee not found"),
    onSuccess: () => {
      toast.success("Skill removed successfully!");
      if (employee) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.employees.skills(employee.id),
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.employees.detail(employee.id),
        });
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to remove skill");
    },
  });

  // Get skills that are not yet assigned to this employee or pending
  const getAvailableSkills = () => {
    if (isEditing && employee) {
      return allSkills.filter(
        (skill: Skill) => !employeeSkills.some((es) => es.skillId === skill.id)
      );
    } else {
      // When creating, filter out pending skills
      return allSkills.filter(
        (skill: Skill) => !pendingSkills.some((ps) => ps.skillId === skill.id)
      );
    }
  };

  const availableSkills = getAvailableSkills();

  const skillOptions = availableSkills.map((skill: Skill) => ({
    value: skill.id.toString(),
    label: `${skill.type} - ${skill.skill}`,
  }));

  const handleAssignSkill = () => {
    if (!selectedSkillId) {
      toast.error("Please select a skill");
      return;
    }
    const ratingNum = parseInt(rating) || 0;

    if (isEditing && employee) {
      // Existing employee - assign immediately
      assignSkillMutation.mutate({
        skillId: parseInt(selectedSkillId),
        rating: ratingNum,
      });
    } else {
      // New employee - add to pending list
      const selectedSkill = allSkills.find(
        (s: Skill) => s.id === parseInt(selectedSkillId)
      );
      if (selectedSkill) {
        setPendingSkills([
          ...pendingSkills,
          {
            skillId: selectedSkill.id,
            rating: ratingNum,
            skill: selectedSkill,
          },
        ]);
        setSelectedSkillId("");
        setRating("0");
      }
    }
  };

  const handleUpdateRating = (skillId: number, currentRating: number) => {
    const newRating = prompt(
      `Enter new rating (0-5):`,
      currentRating.toString()
    );
    if (newRating !== null) {
      const ratingNum = parseInt(newRating);
      if (isNaN(ratingNum) || ratingNum < 0 || ratingNum > 5) {
        toast.error("Rating must be between 0 and 5");
        return;
      }
      updateRatingMutation.mutate({ skillId, rating: ratingNum });
    }
  };

  const handleRemoveSkill = (skillId: number, skillName: string) => {
    if (isEditing && employee) {
      // Existing employee - remove from database
      if (window.confirm(`Remove "${skillName}" from this employee?`)) {
        removeSkillMutation.mutate(skillId);
      }
    } else {
      // New employee - remove from pending list
      setPendingSkills(pendingSkills.filter((ps) => ps.skillId !== skillId));
    }
  };

  const handleUpdatePendingRating = (skillId: number, newRating: number) => {
    setPendingSkills(
      pendingSkills.map((ps) =>
        ps.skillId === skillId ? { ...ps, rating: newRating } : ps
      )
    );
  };

  // Combine employee skills and pending skills for display
  const displaySkills = isEditing
    ? employeeSkills.map((es: EmployeeSkill) => ({
        skillId: es.skillId,
        rating: es.rating,
        skill: es.skill,
        isPending: false,
        id: es.id,
      }))
    : pendingSkills.map((ps, index) => ({
        skillId: ps.skillId,
        rating: ps.rating,
        skill: ps.skill,
        isPending: true,
        id: `pending-${index}`,
      }));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      updateMutation.mutate({ id: employee.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const statusOptions = [
    { value: EmployeeStatus.ACTIVE, label: "Active" },
    { value: EmployeeStatus.ON_VACATION, label: "On Vacation" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Required Fields */}
        <div>
          <Label htmlFor="adaa_emp_code">
            ADAA Employee Code <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            id="adaa_emp_code"
            name="adaa_emp_code"
            value={formData.adaa_emp_code}
            onChange={handleChange}
            placeholder="Enter ADAA employee code"
          />
        </div>

        <div>
          <Label htmlFor="name">
            Full Name <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter full name"
          />
        </div>

        {/* Personal Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DatePicker
            id="dob"
            label="Date of Birth"
            placeholder="Select date of birth"
            defaultDate={formData.dob ? new Date(formData.dob) : undefined}
            onChange={(_dates, currentDateString) => {
              setFormData((prev) => ({ ...prev, dob: currentDateString }));
            }}
          />

          <div>
            <Label htmlFor="nationality">Nationality</Label>
            <Input
              type="text"
              id="nationality"
              name="nationality"
              value={formData.nationality}
              onChange={handleChange}
              placeholder="Enter nationality"
            />
          </div>

          <div>
            <Label htmlFor="contact_no">Contact Number</Label>
            <Input
              type="text"
              id="contact_no"
              name="contact_no"
              value={formData.contact_no}
              onChange={handleChange}
              placeholder="Enter contact number"
            />
          </div>

          <div>
            <Label htmlFor="personal_code">Personal Code</Label>
            <Input
              type="text"
              id="personal_code"
              name="personal_code"
              value={formData.personal_code}
              onChange={handleChange}
              placeholder="Enter personal code"
            />
          </div>
        </div>

        {/* Passport Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="pp_no">Passport Number</Label>
            <Input
              type="text"
              id="pp_no"
              name="pp_no"
              value={formData.pp_no}
              onChange={handleChange}
              placeholder="Enter passport number"
            />
          </div>

          <DatePicker
            id="pp_expiry"
            label="Passport Expiry"
            placeholder="Select passport expiry date"
            defaultDate={
              formData.pp_expiry ? new Date(formData.pp_expiry) : undefined
            }
            onChange={(_dates, currentDateString) => {
              setFormData((prev) => ({
                ...prev,
                pp_expiry: currentDateString,
              }));
            }}
          />
        </div>

        {/* Emirates ID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="emirates_id">Emirates ID</Label>
            <Input
              type="text"
              id="emirates_id"
              name="emirates_id"
              value={formData.emirates_id}
              onChange={handleChange}
              placeholder="Enter Emirates ID"
            />
          </div>

          <DatePicker
            id="emirates_id_expiry"
            label="Emirates ID Expiry"
            placeholder="Select Emirates ID expiry date"
            defaultDate={
              formData.emirates_id_expiry
                ? new Date(formData.emirates_id_expiry)
                : undefined
            }
            onChange={(_dates, currentDateString) => {
              setFormData((prev) => ({
                ...prev,
                emirates_id_expiry: currentDateString,
              }));
            }}
          />
        </div>

        {/* Visa & Work Permit */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DatePicker
            id="visa_expiry"
            label="Visa Expiry"
            placeholder="Select visa expiry date"
            defaultDate={
              formData.visa_expiry ? new Date(formData.visa_expiry) : undefined
            }
            onChange={(_dates, currentDateString) => {
              setFormData((prev) => ({
                ...prev,
                visa_expiry: currentDateString,
              }));
            }}
          />

          <div>
            <Label htmlFor="work_permit_no">Work Permit Number</Label>
            <Input
              type="text"
              id="work_permit_no"
              name="work_permit_no"
              value={formData.work_permit_no}
              onChange={handleChange}
              placeholder="Enter work permit number"
            />
          </div>

          <DatePicker
            id="work_permit_expiry"
            label="Work Permit Expiry"
            placeholder="Select work permit expiry date"
            defaultDate={
              formData.work_permit_expiry
                ? new Date(formData.work_permit_expiry)
                : undefined
            }
            onChange={(_dates, currentDateString) => {
              setFormData((prev) => ({
                ...prev,
                work_permit_expiry: currentDateString,
              }));
            }}
          />
        </div>

        {/* Employment Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DatePicker
            id="date_of_joining"
            label="Date of Joining"
            placeholder="Select date of joining"
            defaultDate={
              formData.date_of_joining
                ? new Date(formData.date_of_joining)
                : undefined
            }
            onChange={(_dates, currentDateString) => {
              setFormData((prev) => ({
                ...prev,
                date_of_joining: currentDateString,
              }));
            }}
          />

          <DatePicker
            id="date_of_arrival"
            label="Date of Arrival"
            placeholder="Select date of arrival"
            defaultDate={
              formData.date_of_arrival
                ? new Date(formData.date_of_arrival)
                : undefined
            }
            onChange={(_dates, currentDateString) => {
              setFormData((prev) => ({
                ...prev,
                date_of_arrival: currentDateString,
              }));
            }}
          />
        </div>

        {/* Status */}
        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            options={statusOptions}
            value={formData.status || EmployeeStatus.ACTIVE}
            onChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                status: value as EmployeeStatus,
              }))
            }
          />
        </div>

        {/* Skills Section - Available for both create and edit */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
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
              <Label htmlFor="rating">Rating (0-5)</Label>
              <Input
                type="number"
                id="rating"
                min="0"
                max="5"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                onClick={handleAssignSkill}
                disabled={
                  (isEditing && assignSkillMutation.isPending) ||
                  !selectedSkillId
                }
                className="w-full"
              >
                {isEditing && assignSkillMutation.isPending
                  ? "Assigning..."
                  : "Assign Skill"}
              </Button>
            </div>
          </div>

          {/* Assigned Skills List */}
          <div className="space-y-2">
            {displaySkills.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No skills assigned yet. Assign skills using the form above.
              </p>
            ) : (
              displaySkills.map((displaySkill: any) => (
                <div
                  key={displaySkill.id}
                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Badge size="sm" color="info">
                      {displaySkill.skill.type}
                    </Badge>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {displaySkill.skill.skill}
                    </span>
                    <Badge size="sm" color="primary">
                      Rating: {displaySkill.rating}/5
                    </Badge>
                    {displaySkill.isPending && (
                      <Badge size="sm" color="light">
                        Pending
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isEditing && !displaySkill.isPending ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleUpdateRating(
                              displaySkill.skillId,
                              displaySkill.rating
                            )
                          }
                          disabled={updateRatingMutation.isPending}
                          className="px-3 py-1 text-xs"
                        >
                          Update Rating
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleRemoveSkill(
                              displaySkill.skillId,
                              `${displaySkill.skill.type} - ${displaySkill.skill.skill}`
                            )
                          }
                          disabled={
                            removeSkillMutation.isPending &&
                            removeSkillMutation.variables ===
                              displaySkill.skillId
                          }
                          className="px-3 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                        >
                          <TrashBinIcon className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Input
                          type="number"
                          min="0"
                          max="5"
                          value={displaySkill.rating}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            const clampedVal = Math.min(5, Math.max(0, val));
                            handleUpdatePendingRating(
                              displaySkill.skillId,
                              clampedVal
                            );
                          }}
                          className="w-20 px-2 py-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleRemoveSkill(
                              displaySkill.skillId,
                              `${displaySkill.skill.type} - ${displaySkill.skill.skill}`
                            )
                          }
                          className="px-3 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                        >
                          <TrashBinIcon className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
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
            ? "Update Employee"
            : "Create Employee"}
        </Button>
      </div>
    </form>
  );
}
