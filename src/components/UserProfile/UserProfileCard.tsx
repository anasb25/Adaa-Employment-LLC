import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import { authApi } from "../../services/api/authApi";
import { Modal } from "../ui/ReusableModal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { toast } from "sonner";
import { QUERY_KEYS } from "../../lib/constants";

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function UserProfileCard() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordData, setPasswordData] = useState<ChangePasswordData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      authApi.changePassword(data),
    onSuccess: () => {
      toast.success("Password changed successfully!");
      setIsPasswordModalOpen(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to change password");
    },
  });

  const handlePasswordChange = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long");
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };

  if (!currentUser) {
    return null;
  }

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
              Profile Information
            </h4>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  First Name
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {currentUser.firstName}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Last Name
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {currentUser.lastName}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Email Address
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {currentUser.email}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Role
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90 capitalize">
                  {currentUser.role?.name || "No role assigned"}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Account Status
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {currentUser.isActive ? "Active" : "Inactive"}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Member Since
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {new Date(currentUser.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            <svg
              className="fill-current"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M9 1.5C7.75736 1.5 6.75 2.50736 6.75 3.75V4.5H5.25C4.00736 4.5 3 5.50736 3 6.75V15C3 16.2426 4.00736 17.25 5.25 17.25H12.75C13.9926 17.25 15 16.2426 15 15V6.75C15 5.50736 13.9926 4.5 12.75 4.5H11.25V3.75C11.25 2.50736 10.2426 1.5 9 1.5ZM9.75 4.5V3.75C9.75 3.33579 9.41421 3 9 3C8.58579 3 8.25 3.33579 8.25 3.75V4.5H9.75ZM4.5 6.75C4.5 6.33579 4.83579 6 5.25 6H12.75C13.1642 6 13.5 6.33579 13.5 6.75V15C13.5 15.4142 13.1642 15.75 12.75 15.75H5.25C4.83579 15.75 4.5 15.4142 4.5 15V6.75ZM9 8.25C8.58579 8.25 8.25 8.58579 8.25 9V12C8.25 12.4142 8.58579 12.75 9 12.75C9.41421 12.75 9.75 12.4142 9.75 12V9C9.75 8.58579 9.41421 8.25 9 8.25Z"
                fill=""
              />
            </svg>
            Change Password
          </button>
        </div>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Change Password"
        size="md"
      >
        <div className="p-6">
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            Enter your current password and choose a new password.
          </p>

          <form className="flex flex-col space-y-5">
            <div>
              <Label>Current Password</Label>
              <Input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    currentPassword: e.target.value,
                  })
                }
                placeholder="Enter your current password"
              />
            </div>

            <div>
              <Label>New Password</Label>
              <Input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    newPassword: e.target.value,
                  })
                }
                placeholder="Enter your new password"
              />
            </div>

            <div>
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    confirmPassword: e.target.value,
                  })
                }
                placeholder="Confirm your new password"
              />
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsPasswordModalOpen(false)}
                disabled={changePasswordMutation.isPending}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePasswordChange}
                disabled={changePasswordMutation.isPending}
                className="flex-1"
              >
                {changePasswordMutation.isPending
                  ? "Changing..."
                  : "Change Password"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
