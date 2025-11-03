import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { employeesApi } from "../../services/api/employeesApi";
import {
  Employee,
  CreateEmployeeRequest,
  EmployeeStatus,
} from "../../types/employee";
import { QUERY_KEYS } from "../../lib/constants";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Select from "../form/Select";
import DatePicker from "../form/date-picker";
import Button from "../ui/button/Button";

interface EmployeeFormProps {
  employee?: Employee;
  onClose: () => void;
}

export default function EmployeeForm({ employee, onClose }: EmployeeFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!employee;

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
    onSuccess: () => {
      toast.success("Employee created successfully!");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.employees.all });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.employees.search,
      });
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
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update employee");
    },
  });

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
