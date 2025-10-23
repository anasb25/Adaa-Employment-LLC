import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { useAuth } from "../../hooks/useAuth";
import { PasswordResetRequest } from "../../types/auth";

export default function PasswordResetForm() {
  const [formData, setFormData] = useState<PasswordResetRequest>({
    email: "",
    oldPassword: "",
    newPassword: "",
  });
  const { resetPassword, isResettingPassword } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.email) {
      toast.error("Email is required");
      return false;
    }
    if (!formData.oldPassword) {
      toast.error("Old password is required");
      return false;
    }
    if (!formData.newPassword) {
      toast.error("New password is required");
      return false;
    }
    if (formData.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    resetPassword(formData);
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Reset Password
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and passwords to reset your password
            </p>
          </div>
          <div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <Label>
                    Email <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="info@gmail.com"
                    disabled={isResettingPassword}
                  />
                </div>
                <div>
                  <Label>
                    Old Password <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    name="oldPassword"
                    type="password"
                    value={formData.oldPassword}
                    onChange={handleInputChange}
                    placeholder="Enter your old password"
                    disabled={isResettingPassword}
                  />
                </div>
                <div>
                  <Label>
                    New Password <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    name="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    placeholder="Enter your new password"
                    disabled={isResettingPassword}
                  />
                </div>
                <div>
                  <Button
                    className="w-full"
                    size="sm"
                    type="submit"
                    disabled={isResettingPassword}
                  >
                    {isResettingPassword ? "Resetting..." : "Reset Password"}
                  </Button>
                </div>
                <div className="text-center">
                  <Link
                    to="/signin"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    Back to Sign In
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
