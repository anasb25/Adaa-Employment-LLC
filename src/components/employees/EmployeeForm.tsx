import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { employeesApi } from "../../services/api/employeesApi";
import { employeeSkillsApi } from "../../services/api/employeeSkillsApi";
import { skillsApi } from "../../services/api/skillsApi";
import { Employee, CreateEmployeeRequest } from "../../types/employee";
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
  cost_price?: number;
  skill: Skill;
}

export default function EmployeeForm({ employee, onClose }: EmployeeFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!employee;
  const [selectedSkillId, setSelectedSkillId] = useState<string>("");
  const [rating, setRating] = useState<string>("0");
  const [costPrice, setCostPrice] = useState<string>("");
  const [pendingSkills, setPendingSkills] = useState<PendingSkill[]>([]);
  const [editingSkillId, setEditingSkillId] = useState<number | null>(null);
  const [editingRating, setEditingRating] = useState<string>("0");
  const [editingCostPrice, setEditingCostPrice] = useState<string>("");

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
    date_of_joining: employee?.date_of_joining || "",
    date_of_arrival: employee?.date_of_arrival || "",
    basic_salary: employee?.basic_salary || undefined,
    hra: employee?.hra || undefined,
    other_allowance: employee?.other_allowance || undefined,
    air_tickets: employee?.air_tickets || undefined,
    annual_leave_balance: employee?.annual_leave_balance || undefined,
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
                cost_price: pendingSkill.cost_price,
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

  // Auto-fill cost price from selected skill
  useEffect(() => {
    if (selectedSkillId) {
      const selectedSkill = allSkills.find(
        (s: Skill) => s.id === parseInt(selectedSkillId)
      );
      if (selectedSkill && selectedSkill.cost_price !== undefined) {
        setCostPrice(selectedSkill.cost_price?.toString());
      }
    }
  }, [selectedSkillId, allSkills]);

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
    mutationFn: ({
      skillId,
      rating,
      cost_price,
    }: {
      skillId: number;
      rating: number;
      cost_price?: number;
    }) =>
      employee
        ? employeeSkillsApi.assignSkill(employee.id, {
            skillId,
            rating,
            cost_price,
          })
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

  // Update skill mutation (rating and cost_price)
  const updateSkillMutation = useMutation({
    mutationFn: ({
      skillId,
      rating,
      cost_price,
    }: {
      skillId: number;
      rating: number;
      cost_price?: number;
    }) =>
      employee
        ? employeeSkillsApi.assignSkill(employee.id, {
            skillId,
            rating,
            cost_price,
          })
        : Promise.reject("Employee not found"),
    onSuccess: () => {
      toast.success("Skill updated successfully!");
      if (employee) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.employees.skills(employee.id),
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.employees.detail(employee.id),
        });
      }
      setEditingSkillId(null);
      setEditingRating("0");
      setEditingCostPrice("");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update skill");
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
    label: `${skill.skillType?.type || "Unknown"} - ${skill.skill}`,
  }));

  const handleAssignSkill = () => {
    if (!selectedSkillId) {
      toast.error("Please select a skill");
      return;
    }
    const ratingNum = parseInt(rating) || 0;
    const costPriceNum = costPrice ? parseFloat(costPrice) : undefined;

    if (isEditing && employee) {
      // Existing employee - assign immediately
      assignSkillMutation.mutate({
        skillId: parseInt(selectedSkillId),
        rating: ratingNum,
        cost_price: costPriceNum,
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
            cost_price: costPriceNum,
            skill: selectedSkill,
          },
        ]);
        setSelectedSkillId("");
        setRating("0");
        setCostPrice("");
      }
    }
  };

  const handleStartEdit = (
    skillId: number,
    currentRating: number,
    currentCostPrice?: number
  ) => {
    setEditingSkillId(skillId);
    setEditingRating(currentRating.toString());
    setEditingCostPrice(
      currentCostPrice !== undefined && currentCostPrice !== null
        ? currentCostPrice.toString()
        : ""
    );
  };

  const handleSaveEdit = () => {
    if (editingSkillId === null) return;

    const ratingNum = parseInt(editingRating) || 0;
    if (ratingNum < 0 || ratingNum > 5) {
      toast.error("Rating must be between 0 and 5");
      return;
    }

    const costPriceNum = editingCostPrice
      ? parseFloat(editingCostPrice)
      : undefined;

    updateSkillMutation.mutate({
      skillId: editingSkillId,
      rating: ratingNum,
      cost_price: costPriceNum,
    });
  };

  const handleCancelEdit = () => {
    setEditingSkillId(null);
    setEditingRating("0");
    setEditingCostPrice("");
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
        cost_price: es.cost_price,
        skill: es.skill,
        isPending: false,
        id: es.id,
      }))
    : pendingSkills.map((ps, index) => ({
        skillId: ps.skillId,
        rating: ps.rating,
        cost_price: ps.cost_price,
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
        </div>

        {/* Salary Information */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Salary Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="basic_salary">Basic Salary</Label>
              <Input
                type="number"
                id="basic_salary"
                value={formData.basic_salary || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    basic_salary: e.target.value
                      ? parseFloat(e.target.value)
                      : undefined,
                  }))
                }
                placeholder="Enter basic salary"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <Label htmlFor="hra">HRA (House Rent Allowance)</Label>
              <Input
                type="number"
                id="hra"
                value={formData.hra || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    hra: e.target.value
                      ? parseFloat(e.target.value)
                      : undefined,
                  }))
                }
                placeholder="Enter HRA"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <Label htmlFor="other_allowance">Other Allowance</Label>
              <Input
                type="number"
                id="other_allowance"
                value={formData.other_allowance || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    other_allowance: e.target.value
                      ? parseFloat(e.target.value)
                      : undefined,
                  }))
                }
                placeholder="Enter other allowances"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Air Tickets and Annual Leave Balance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <Label htmlFor="air_tickets">Air Tickets</Label>
              <Input
                type="number"
                id="air_tickets"
                value={formData.air_tickets || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    air_tickets: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  }))
                }
                placeholder="Auto-calculated from date of joining"
                min="0"
                step="1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Auto-increments every year from date of joining
              </p>
            </div>
            <div>
              <Label htmlFor="annual_leave_balance">
                Annual Leave Balance (Days)
              </Label>
              <Input
                type="number"
                id="annual_leave_balance"
                value={formData.annual_leave_balance || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    annual_leave_balance: e.target.value
                      ? parseFloat(e.target.value)
                      : undefined,
                  }))
                }
                placeholder="Auto-calculated from date of joining"
                min="0"
                step="0.01"
              />
              <p className="text-xs text-gray-500 mt-1">
                Auto-adds 30 days every year from date of joining
              </p>
            </div>
          </div>

          {/* Salary Summary Card */}
          {(formData.basic_salary ||
            formData.hra ||
            formData.other_allowance) && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-green-900 dark:text-green-100">
                  Total Monthly Salary
                </span>
                <span className="text-lg font-bold text-green-700 dark:text-green-400">
                  AED{" "}
                  {(
                    (parseFloat(formData.basic_salary?.toString() || "0") ||
                      0) +
                    (parseFloat(formData.hra?.toString() || "0") || 0) +
                    (parseFloat(formData.other_allowance?.toString() || "0") ||
                      0)
                  ).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Skills Section - Available for both create and edit */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Employee Skills
          </h3>

          {/* Assign New Skill */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <div>
                <Label htmlFor="cost_price">Cost Price (Optional)</Label>
                <Input
                  type="number"
                  id="cost_price"
                  value={costPrice || ""}
                  onChange={(e) => setCostPrice(e.target.value)}
                  placeholder="Auto-filled from skill"
                />
              </div>
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
              displaySkills.map((displaySkill: any) => {
                const isCurrentlyEditing =
                  editingSkillId === displaySkill.skillId;

                return (
                  <div
                    key={displaySkill.id}
                    className={`p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg ${
                      isCurrentlyEditing
                        ? "border-blue-300 dark:border-blue-700"
                        : ""
                    }`}
                  >
                    {isCurrentlyEditing &&
                    isEditing &&
                    !displaySkill.isPending ? (
                      // Inline editing form
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 mb-3">
                          <Badge size="sm" color="info">
                            {displaySkill.skill.skillType?.type || "N/A"}
                          </Badge>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {displaySkill.skill.skill}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label
                              htmlFor={`edit-rating-${displaySkill.skillId}`}
                            >
                              Rating (0-5)
                            </Label>
                            <Input
                              type="number"
                              id={`edit-rating-${displaySkill.skillId}`}
                              value={editingRating}
                              onChange={(e) => setEditingRating(e.target.value)}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <Label
                              htmlFor={`edit-cost-${displaySkill.skillId}`}
                            >
                              Cost Price (Optional)
                            </Label>
                            <Input
                              type="number"
                              id={`edit-cost-${displaySkill.skillId}`}
                              value={editingCostPrice || ""}
                              onChange={(e) =>
                                setEditingCostPrice(e.target.value)
                              }
                              placeholder="Enter cost price"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            onClick={handleSaveEdit}
                            disabled={updateSkillMutation.isPending}
                            size="sm"
                            className="flex-1"
                          >
                            {updateSkillMutation.isPending
                              ? "Saving..."
                              : "Save"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancelEdit}
                            disabled={updateSkillMutation.isPending}
                            size="sm"
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // Normal view
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <Badge size="sm" color="info">
                            {displaySkill.skill.skillType?.type || "N/A"}
                          </Badge>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {displaySkill.skill.skill}
                          </span>
                          <Badge size="sm" color="primary">
                            Rating: {displaySkill.rating}/5
                          </Badge>
                          {displaySkill.cost_price !== undefined &&
                            displaySkill.cost_price !== null && (
                              <Badge size="sm" color="success">
                                ${Number(displaySkill.cost_price).toFixed(2)}
                              </Badge>
                            )}
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
                                  handleStartEdit(
                                    displaySkill.skillId,
                                    displaySkill.rating,
                                    displaySkill.cost_price
                                  )
                                }
                                disabled={updateSkillMutation.isPending}
                                className="px-3 py-1 text-xs"
                              >
                                Edit
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleRemoveSkill(
                                    displaySkill.skillId,
                                    `${
                                      displaySkill.skill.skillType?.type ||
                                      "N/A"
                                    } - ${displaySkill.skill.skill}`
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
                                  const clampedVal = Math.min(
                                    5,
                                    Math.max(0, val)
                                  );
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
                                    `${
                                      displaySkill.skill.skillType?.type ||
                                      "N/A"
                                    } - ${displaySkill.skill.skill}`
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
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Salary & Rate Summary Card */}
          {isEditing && employee && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">
                Salary & Rate Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                    Monthly Salary Components
                  </p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-800 dark:text-blue-200">
                        Basic Salary:
                      </span>
                      <span className="font-medium text-blue-900 dark:text-blue-100">
                        AED{" "}
                        {employee.basic_salary
                          ? parseFloat(
                              employee.basic_salary.toString()
                            ).toFixed(2)
                          : "0.00"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-800 dark:text-blue-200">
                        HRA:
                      </span>
                      <span className="font-medium text-blue-900 dark:text-blue-100">
                        AED{" "}
                        {employee.hra
                          ? parseFloat(employee.hra.toString()).toFixed(2)
                          : "0.00"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-800 dark:text-blue-200">
                        Other Allowance:
                      </span>
                      <span className="font-medium text-blue-900 dark:text-blue-100">
                        AED{" "}
                        {employee.other_allowance
                          ? parseFloat(
                              employee.other_allowance.toString()
                            ).toFixed(2)
                          : "0.00"}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 mt-2 border-t border-blue-200 dark:border-blue-700">
                      <span className="font-semibold text-blue-900 dark:text-blue-100">
                        Total:
                      </span>
                      <span className="font-bold text-blue-900 dark:text-blue-100">
                        AED{" "}
                        {(
                          (parseFloat(
                            employee.basic_salary?.toString() || "0"
                          ) || 0) +
                          (parseFloat(employee.hra?.toString() || "0") || 0) +
                          (parseFloat(
                            employee.other_allowance?.toString() || "0"
                          ) || 0)
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                    Hourly Rates (from Skills)
                  </p>
                  <div className="space-y-1 text-sm">
                    {displaySkills.length > 0 ? (
                      displaySkills.map((skill: any) => (
                        <div key={skill.id} className="flex justify-between">
                          <span className="text-blue-800 dark:text-blue-200 truncate">
                            {skill.skill.skill}:
                          </span>
                          <span className="font-medium text-blue-900 dark:text-blue-100 ml-2">
                            {skill.cost_price
                              ? `AED ${parseFloat(
                                  skill.cost_price.toString()
                                ).toFixed(2)}/hr`
                              : "Not set"}
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-blue-700 dark:text-blue-300 italic">
                        No skills assigned
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
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
