import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { authApi, AuthApiError } from "../../services/authApi";
import { PasswordResetRequest } from "../../types/auth";

export default function PasswordResetForm() {
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<PasswordResetRequest>({
    email: "",
    oldPassword: "",
    newPassword: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "confirmPassword") {
      setConfirmPassword(value);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    // Clear error when user starts typing
    if (error) setError("");
    if (success) setSuccess("");
  };

  const validateForm = (): boolean => {
    if (!formData.email) {
      setError("Email is required");
      return false;
    }
    if (!formData.oldPassword) {
      setError("Current password is required");
      return false;
    }
    if (!formData.newPassword) {
      setError("New password is required");
      return false;
    }
    if (formData.newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return false;
    }
    if (formData.newPassword !== confirmPassword) {
      setError("New password and confirm password do not match");
      return false;
    }
    if (formData.oldPassword === formData.newPassword) {
      setError("New password must be different from current password");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }
    return true;
  };

  const handleButtonClick = () => {
    handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      await authApi.resetPassword(formData);
      setSuccess("Password has been reset successfully!");

      // Clear form
      setFormData({
        email: "",
        oldPassword: "",
        newPassword: "",
      });
      setConfirmPassword("");

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err) {
      if (err instanceof AuthApiError) {
        if (err.status === 401) {
          setError("Current password is incorrect");
        } else if (err.status === 400 && err.errors) {
          // Handle validation errors
          const firstError = Object.values(err.errors)[0]?.[0];
          setError(firstError || "Please check your input");
        } else {
          setError(err.message || "An error occurred during password reset");
        }
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Forgot Password
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and current password to reset your password.
            </p>
          </div>
          <div>
            {error && (
              <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                {success}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <Label>
                    Email <span className="text-error-500">*</span>{" "}
                  </Label>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <Label>
                    Current Password <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input
                      name="oldPassword"
                      type={showOldPassword ? "text" : "password"}
                      value={formData.oldPassword}
                      onChange={handleInputChange}
                      placeholder="Enter your current password"
                    />
                    <span
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showOldPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                </div>
                <div>
                  <Label>
                    New Password <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input
                      name="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      placeholder="Enter your new password"
                    />
                    <span
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showNewPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                </div>
                <div>
                  <Label>
                    Confirm New Password{" "}
                    <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm your new password"
                    />
                    <span
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showConfirmPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                </div>
                <div>
                  <Button
                    className="w-full"
                    size="sm"
                    disabled={isLoading}
                    onClick={handleButtonClick}
                  >
                    {isLoading ? "Resetting Password..." : "Reset Password"}
                  </Button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Remember your password? {""}
                <Link
                  to="/signin"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
