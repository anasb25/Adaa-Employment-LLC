import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { usersApi } from "../../services/api/usersApi";
import { QUERY_KEYS } from "../../lib/constants";
import { Role, User } from "../../types/auth";
import { Modal } from "../ui/ReusableModal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";

interface EditUserModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  roles: Role[];
}

export default function EditUserModal({
  user,
  isOpen,
  onClose,
  roles,
}: EditUserModalProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    roleId: "",
  });

  useEffect(() => {
    if (!user || !isOpen) return;
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: "",
      roleId: String(user.role?.id ?? ""),
    });
  }, [user, isOpen]);

  const updateMutation = useMutation({
    mutationFn: () =>
      usersApi.updateUser(user!.id, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        roleId: Number(form.roleId),
        ...(form.password.trim()
          ? { password: form.password }
          : {}),
      }),
    onSuccess: () => {
      toast.success("User updated");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.search });
      onClose();
    },
    onError: (error: any) => {
      const message = error.response?.data?.message;
      toast.error(
        Array.isArray(message) ? message[0] : message || "Failed to update user",
      );
    },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.roleId) {
      toast.error("Select a role");
      return;
    }
    updateMutation.mutate();
  };

  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit user" size="md">
      <form onSubmit={handleSubmit} className="space-y-4 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-gray-700 dark:text-gray-300">
              First name
            </span>
            <Input
              value={form.firstName}
              onChange={(e) =>
                setForm((current) => ({ ...current, firstName: e.target.value }))
              }
              placeholder="First name"
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-gray-700 dark:text-gray-300">
              Last name
            </span>
            <Input
              value={form.lastName}
              onChange={(e) =>
                setForm((current) => ({ ...current, lastName: e.target.value }))
              }
              placeholder="Last name"
              required
            />
          </label>
        </div>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-gray-700 dark:text-gray-300">
            Email
          </span>
          <Input
            type="email"
            value={form.email}
            onChange={(e) =>
              setForm((current) => ({ ...current, email: e.target.value }))
            }
            placeholder="name@example.com"
            required
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-gray-700 dark:text-gray-300">
            New password
          </span>
          <Input
            type="password"
            value={form.password}
            onChange={(e) =>
              setForm((current) => ({ ...current, password: e.target.value }))
            }
            placeholder="Leave blank to keep current password"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-gray-700 dark:text-gray-300">
            Role
          </span>
          <select
            value={form.roleId}
            onChange={(e) =>
              setForm((current) => ({ ...current, roleId: e.target.value }))
            }
            required
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          >
            <option value="">Select a role</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </label>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
