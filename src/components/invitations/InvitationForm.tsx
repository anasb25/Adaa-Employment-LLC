import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invitationApi } from "../../services/api/invitationApi";
import { CreateInvitationRequest } from "../../types/invitation";
import RoleSelect from "../form/RoleSelect";
import InputField from "../form/input/InputField";
import Button from "../ui/button/Button";
import { QUERY_KEYS } from "../../lib/constants";
import { toast } from "sonner";

interface InvitationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const InvitationForm: React.FC<InvitationFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateInvitationRequest>({
    email: "",
    roleId: 0,
  });

  const createInvitationMutation = useMutation({
    mutationFn: (data: CreateInvitationRequest) =>
      invitationApi.createInvitation(data),
    onSuccess: () => {
      toast.success("Invitation sent successfully!");
      setFormData({ email: "", roleId: 0 });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invitations.my });

      // Call success callback after a short delay
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message ||
          "Failed to send invitation. Please try again."
      );
    },
  });

  const handleInputChange = (
    field: keyof CreateInvitationRequest,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return false;
    }

    if (!formData.email.includes("@")) {
      toast.error("Please enter a valid email address");
      return false;
    }

    if (!formData.roleId || formData.roleId <= 0) {
      toast.error("Please select a role");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    createInvitationMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({ email: "", roleId: 0 });
    onCancel?.();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Invite New User
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Send an invitation to a new user with a specific role.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email Address *
          </label>
          <InputField
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            placeholder="Enter email address"
            disabled={createInvitationMutation.isPending}
            className="w-full"
          />
        </div>

        {/* Role Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Role *
          </label>
          <RoleSelect
            value={formData.roleId}
            onChange={(roleId) => handleInputChange("roleId", roleId)}
            placeholder="Select a role for the user"
            disabled={createInvitationMutation.isPending}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={createInvitationMutation.isPending}
            className="px-6 py-2"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createInvitationMutation.isPending}
            className="px-6 py-2"
          >
            {createInvitationMutation.isPending
              ? "Sending..."
              : "Send Invitation"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default InvitationForm;
