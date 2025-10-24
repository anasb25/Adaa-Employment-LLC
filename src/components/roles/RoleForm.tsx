import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { rolesApi } from "../../services/api/rolesApi";
import { Role } from "../../types/auth";
import { QUERY_KEYS } from "../../lib/constants";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";

interface RoleFormProps {
  role?: Role;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function RoleForm({ role, onSuccess, onCancel }: RoleFormProps) {
  const [formData, setFormData] = useState({
    name: role?.name || "",
    description: role?.description || "",
  });

  const queryClient = useQueryClient();

  const createRoleMutation = useMutation({
    mutationFn: (data: Partial<Role>) => rolesApi.createRole(data),
    onSuccess: () => {
      toast.success("Role created successfully!");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.roles.all });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message ||
          "Failed to create role. Please try again."
      );
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Role> }) =>
      rolesApi.updateRole(id, data),
    onSuccess: () => {
      toast.success("Role updated successfully!");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.roles.all });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message ||
          "Failed to update role. Please try again."
      );
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error("Role name is required");
      return false;
    }
    if (formData.name.length < 2) {
      toast.error("Role name must be at least 2 characters");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const roleData = {
      name: formData.name.trim().toLowerCase(),
      description: formData.description.trim(),
    };

    if (role) {
      updateRoleMutation.mutate({ id: role.id, data: roleData });
    } else {
      createRoleMutation.mutate(roleData);
    }
  };

  const isLoading =
    createRoleMutation.isPending || updateRoleMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Role Name</Label>
        <Input
          id="name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="e.g., manager, editor, viewer"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          name="description"
          type="text"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Brief description of the role"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isLoading} className="px-6 py-2">
          {isLoading ? "Saving..." : role ? "Update Role" : "Create Role"}
        </Button>

        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="px-6 py-2"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
