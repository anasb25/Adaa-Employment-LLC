import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { toast } from "sonner";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { invitationApi } from "../../services/api/invitationApi";
import {
  ValidateInvitationResponse,
  AcceptInvitationRequest,
} from "../../types/invitation";

export default function AcceptInvitationForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [showPassword, setShowPassword] = useState(false);
  const [validationResult, setValidationResult] =
    useState<ValidateInvitationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<AcceptInvitationRequest>({
    token: token || "",
    email: "",
    firstName: "",
    lastName: "",
    password: "",
  });

  useEffect(() => {
    if (!token) {
      toast.error("Invalid invitation link");
      navigate("/signin");
      return;
    }

    const validateToken = async () => {
      try {
        setLoading(true);
        const result = await invitationApi.validateInvitation(token);
        setValidationResult(result);

        if (result.isValid && result.invitation) {
          setFormData((prev) => ({
            ...prev,
            email: result.invitation!.email,
          }));
        } else {
          toast.error(result.message || "Invalid invitation");
        }
      } catch (error: any) {
        console.error("Failed to validate invitation:", error);
        toast.error("Failed to validate invitation");
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.firstName.trim()) {
      toast.error("First name is required");
      return false;
    }

    if (!formData.lastName.trim()) {
      toast.error("Last name is required");
      return false;
    }

    if (!formData.password.trim()) {
      toast.error("Password is required");
      return false;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      await invitationApi.completeSignup(formData);

      toast.success("Account created successfully! You can now sign in.");
      navigate("/signin", {
        state: {
          message:
            "Account created successfully! Please sign in with your credentials.",
        },
      });
    } catch (error: any) {
      console.error("Failed to complete signup:", error);
      toast.error(error.response?.data?.message || "Failed to complete signup");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col flex-1">
        <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
            <div className="space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-12 bg-gray-200 dark:bg-gray-700 rounded"
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!validationResult?.isValid) {
    return (
      <div className="flex flex-col flex-1">
        <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <svg
                className="w-16 h-16 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Invalid Invitation
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {validationResult?.message ||
                "This invitation is no longer valid."}
            </p>
            <Button onClick={() => navigate("/signin")} className="w-full">
              Go to Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const invitation = validationResult.invitation!;

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Complete Your Registration
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              You've been invited by{" "}
              <span className="font-medium text-gray-800 dark:text-white">
                {invitation.inviter.firstName} {invitation.inviter.lastName}
              </span>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Role: <span className="font-medium">{invitation.role.name}</span>
            </p>
          </div>
          <div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Email (read-only) */}
                <div>
                  <Label>
                    Email <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                  />
                </div>

                {/* First Name */}
                <div>
                  <Label>
                    First Name <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Enter your first name"
                    disabled={submitting}
                  />
                </div>

                {/* Last Name */}
                <div>
                  <Label>
                    Last Name <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Enter your last name"
                    disabled={submitting}
                  />
                </div>

                {/* Password */}
                <div>
                  <Label>
                    Password <span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter your password"
                      disabled={submitting}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeCloseIcon className="w-5 h-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="w-5 h-5 text-gray-400" />
                      )}
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="space-y-4">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full"
                  >
                    {submitting ? "Creating Account..." : "Create Account"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
