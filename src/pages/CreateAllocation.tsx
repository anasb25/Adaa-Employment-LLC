import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { allocationsApi } from "../services/api/allocationsApi";
import { employeesApi } from "../services/api/employeesApi";
import { projectsApi } from "../services/api/projectsApi";
import { skillsApi } from "../services/api/skillsApi";
import { QUERY_KEYS } from "../lib/constants";
import { CreateAllocationRequest } from "../types/allocation";
import { Employee } from "../types/employee";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import PermissionGuard from "../components/auth/PermissionGuard";
import Button from "../components/ui/button/Button";
import Input from "../components/form/input/InputField";
import Label from "../components/form/Label";
import Select from "../components/form/Select";
import DatePicker from "../components/form/date-picker";
import Badge from "../components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../components/ui/table";

export default function CreateAllocation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [projectId, setProjectId] = useState<number>(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedSkillId, setSelectedSkillId] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const { data: projectsData } = useQuery({
    queryKey: QUERY_KEYS.projects.all,
    queryFn: () => projectsApi.getProjects(),
  });

  const { data: employeesData } = useQuery({
    queryKey: QUERY_KEYS.employees.all,
    queryFn: () => employeesApi.getEmployees(),
  });

  const { data: skillsData } = useQuery({
    queryKey: QUERY_KEYS.skills.all,
    queryFn: () => skillsApi.getSkills(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateAllocationRequest) =>
      allocationsApi.createAllocation(data),
    onSuccess: () => {
      toast.success("Employees allocated successfully!");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allocations.all });
      navigate("/allocations");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to create allocations"
      );
    },
  });

  // Filter employees by selected skill and search term for suggestions
  const suggestedEmployees = useMemo(() => {
    if (!employeesData?.data || !searchTerm) return [];

    let filtered = [...employeesData.data];

    // Filter by skill if selected
    if (selectedSkillId) {
      filtered = filtered.filter((emp: Employee) =>
        emp.employeeSkills?.some((es) => es.skillId === selectedSkillId)
      );
    }

    // Filter by search term
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter((emp: Employee) => {
      const nameMatch = emp.name?.toLowerCase().includes(term);
      const codeMatch = emp.adaa_emp_code?.toLowerCase().includes(term);
      return nameMatch || codeMatch;
    });

    // Exclude already selected employees
    filtered = filtered.filter((emp) => !selectedEmployeeIds.includes(emp.id));

    // Limit to 10 suggestions
    return filtered.slice(0, 10);
  }, [employeesData, selectedSkillId, searchTerm, selectedEmployeeIds]);

  // Get selected employees data
  const selectedEmployees = useMemo(() => {
    if (!employeesData?.data) return [];
    return employeesData.data.filter((emp: Employee) =>
      selectedEmployeeIds.includes(emp.id)
    );
  }, [employeesData, selectedEmployeeIds]);

  // Group selected employees by skill type, then by skill
  const groupedEmployees = useMemo(() => {
    const groups: Record<
      string,
      Record<string, { skill: any; employees: Employee[] }>
    > = {};

    selectedEmployees.forEach((emp: Employee) => {
      if (!emp.employeeSkills || emp.employeeSkills.length === 0) {
        // Handle employees without skills
        if (!groups["No Skill Type"]) groups["No Skill Type"] = {};
        if (!groups["No Skill Type"]["No Skill"]) {
          groups["No Skill Type"]["No Skill"] = {
            skill: { name: "No Skill", skillType: { type: "No Skill Type" } },
            employees: [],
          };
        }
        groups["No Skill Type"]["No Skill"].employees.push(emp);
      } else {
        // Group by first skill's type
        const firstSkill = emp.employeeSkills[0].skill;
        const skillTypeName = firstSkill?.skillType?.type || "Unknown Type";
        const skillName = firstSkill?.skill || "Unknown Skill";

        if (!groups[skillTypeName]) groups[skillTypeName] = {};
        if (!groups[skillTypeName][skillName]) {
          groups[skillTypeName][skillName] = {
            skill: firstSkill,
            employees: [],
          };
        }
        groups[skillTypeName][skillName].employees.push(emp);
      }
    });

    return groups;
  }, [selectedEmployees]);

  const addEmployee = (emp: Employee) => {
    if (!selectedEmployeeIds.includes(emp.id)) {
      setSelectedEmployeeIds((prev) => [...prev, emp.id]);
      setSearchTerm("");
      setShowSuggestions(false);
    }
  };

  const removeEmployee = (empId: number) => {
    setSelectedEmployeeIds((prev) => prev.filter((id) => id !== empId));
  };

  const handleSubmit = () => {
    if (!projectId) {
      toast.error("Please select a project");
      return;
    }
    if (!startDate) {
      toast.error("Please set a start date");
      return;
    }
    if (selectedEmployeeIds.length === 0) {
      toast.error("Please select at least one employee");
      return;
    }

    const payload: CreateAllocationRequest = {
      projectId,
      startDate,
      endDate: endDate || undefined,
      employeeIds: selectedEmployeeIds,
      notes: notes || undefined,
    };

    createMutation.mutate(payload);
  };

  const selectedProject = projectsData?.data?.find(
    (p: any) => p.id === projectId
  );

  return (
    <>
      <PageMeta
        title="Allocate Employees | ADAA Employment LLC"
        description="Allocate employees to projects"
      />
      <PermissionGuard permission="employee:create">
        <PageBreadcrumb pageTitle="Allocate Employees to Project" />

        <div className="space-y-6">
          {/* Step 1: Select Project */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              1. Select Project
            </h2>
            <div className="max-w-md">
              <Label htmlFor="project">
                Project <span className="text-red-500">*</span>
              </Label>
              <Select
                options={(projectsData?.data || []).map((p: any) => ({
                  value: String(p.id),
                  label: `${p.name} - ${p.location}`,
                }))}
                value={projectId ? String(projectId) : ""}
                onChange={(v) => setProjectId(Number(v))}
                placeholder="Select a project"
              />
              {selectedProject && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>Client:</strong> {selectedProject.client?.name}
                  </p>
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>Location:</strong> {selectedProject.location}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Set Dates */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              2. Set Allocation Period
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
              <div>
                <Label htmlFor="startDate">
                  Start Date <span className="text-red-500">*</span>
                </Label>
                <DatePicker
                  id="startDate"
                  placeholder="Select start date"
                  defaultDate={startDate ? new Date(startDate) : undefined}
                  onChange={(_dates, currentDateString) => {
                    setStartDate(currentDateString);
                  }}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <DatePicker
                  id="endDate"
                  placeholder="Select end date"
                  defaultDate={endDate ? new Date(endDate) : undefined}
                  onChange={(_dates, currentDateString) => {
                    setEndDate(currentDateString);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Step 3: Select Employees */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              3. Select Employees
            </h2>

            {/* Filters & Search */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <Label htmlFor="skill">Filter by Skill (Optional)</Label>
                <Select
                  options={[
                    { value: "0", label: "All Skills" },
                    ...(skillsData?.data || []).map((s: any) => ({
                      value: String(s.id),
                      label: `${s.skill} (${s.skillType?.type || "N/A"})`,
                    })),
                  ]}
                  value={String(selectedSkillId)}
                  onChange={(v) => setSelectedSkillId(Number(v))}
                  placeholder="Filter by skill"
                />
              </div>
              <div className="relative" ref={searchContainerRef}>
                <Label htmlFor="search">Search & Add Employees</Label>
                <Input
                  id="search"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowSuggestions(true);
                  }}
                  placeholder="Search by name or employee code..."
                />

                {/* Suggestions Dropdown */}
                {showSuggestions &&
                  searchTerm &&
                  suggestedEmployees.length > 0 && (
                    <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                      {suggestedEmployees.map((emp: Employee) => (
                        <div
                          key={emp.id}
                          onClick={() => addEmployee(emp)}
                          className="p-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              {/* Name and Code */}
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-gray-900 dark:text-white text-sm">
                                  {emp.name}
                                </p>
                                <span className="text-xs px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded font-mono">
                                  {emp.adaa_emp_code}
                                </span>
                              </div>

                              {/* Skills */}
                              {emp.employeeSkills &&
                                emp.employeeSkills.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {emp.employeeSkills.map((es: any) => (
                                      <span
                                        key={es.id}
                                        className="text-xs px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded"
                                      >
                                        {es.skill?.skill} -{" "}
                                        {es.skill?.skillType?.type}
                                      </span>
                                    ))}
                                  </div>
                                )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                {showSuggestions &&
                  searchTerm &&
                  suggestedEmployees.length === 0 && (
                    <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No employees found matching your search.
                      </p>
                    </div>
                  )}
              </div>
            </div>

            {/* Selected Count */}
            <div className="mb-4">
              <Badge color="info" size="md">
                {selectedEmployeeIds.length} employee(s) selected
              </Badge>
            </div>

            {/* Selected Employees Table - Grouped by Skill Type & Skill */}
            {selectedEmployees.length > 0 && (
              <div className="space-y-4">
                {Object.entries(groupedEmployees).map(
                  ([skillTypeName, skillGroups]) => (
                    <div
                      key={skillTypeName}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                    >
                      {/* Skill Type Header */}
                      <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {skillTypeName}
                        </h3>
                      </div>

                      {/* Skill Groups */}
                      {Object.entries(skillGroups).map(
                        ([skillName, { employees }]) => (
                          <div key={skillName}>
                            {/* Skill Name Subheader */}
                            <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-1.5 border-b border-gray-200 dark:border-gray-700">
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {skillName}{" "}
                                <span className="text-gray-500">
                                  ({employees.length})
                                </span>
                              </p>
                            </div>

                            {/* Employees Table */}
                            <Table>
                              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                                <TableRow>
                                  <TableCell
                                    isHeader
                                    className="px-4 py-2 text-xs text-gray-500 text-start"
                                  >
                                    Name
                                  </TableCell>
                                  <TableCell
                                    isHeader
                                    className="px-4 py-2 text-xs text-gray-500 text-start"
                                  >
                                    Code
                                  </TableCell>
                                  <TableCell
                                    isHeader
                                    className="px-4 py-2 text-xs text-gray-500 text-start"
                                  >
                                    Nationality
                                  </TableCell>
                                  <TableCell
                                    isHeader
                                    className="px-4 py-2 text-xs text-gray-500 text-start"
                                  >
                                    Passport
                                  </TableCell>
                                  <TableCell
                                    isHeader
                                    className="px-4 py-2 text-xs text-gray-500 text-start"
                                  >
                                    All Skills
                                  </TableCell>
                                  <TableCell
                                    isHeader
                                    className="px-4 py-2 text-xs text-gray-500 text-start"
                                  >
                                    Action
                                  </TableCell>
                                </TableRow>
                              </TableHeader>
                              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                                {employees.map((emp) => (
                                  <TableRow key={emp.id}>
                                    <TableCell className="px-4 py-2 text-sm text-gray-800 dark:text-white/90 text-start">
                                      {emp.name}
                                    </TableCell>
                                    <TableCell className="px-4 py-2 text-sm text-gray-800 dark:text-white/90 text-start">
                                      {emp.adaa_emp_code}
                                    </TableCell>
                                    <TableCell className="px-4 py-2 text-sm text-gray-800 dark:text-white/90 text-start">
                                      {emp.nationality}
                                    </TableCell>
                                    <TableCell className="px-4 py-2 text-sm text-gray-800 dark:text-white/90 text-start">
                                      {emp.pp_no}
                                    </TableCell>
                                    <TableCell className="px-4 py-2 text-start">
                                      <div className="flex flex-wrap gap-1">
                                        {emp.employeeSkills &&
                                        emp.employeeSkills.length > 0 ? (
                                          emp.employeeSkills.map((es: any) => (
                                            <Badge
                                              key={es.id}
                                              color="light"
                                              size="sm"
                                            >
                                              {es.skill?.skill}
                                            </Badge>
                                          ))
                                        ) : (
                                          <span className="text-xs text-gray-500">
                                            —
                                          </span>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className="px-4 py-2 text-start">
                                      <Button
                                        variant="outline"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 text-xs px-2 py-1"
                                        onClick={() => removeEmployee(emp.id)}
                                      >
                                        Remove
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )
                      )}
                    </div>
                  )
                )}
              </div>
            )}

            {selectedEmployees.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">
                  No employees selected. Search and click to add employees
                  above.
                </p>
              </div>
            )}
          </div>

          {/* Notes (Optional) */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional information..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => navigate("/allocations")}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                createMutation.isPending || selectedEmployeeIds.length === 0
              }
            >
              {createMutation.isPending
                ? "Allocating..."
                : `Allocate ${selectedEmployeeIds.length} Employee(s)`}
            </Button>
          </div>
        </div>
      </PermissionGuard>
    </>
  );
}
