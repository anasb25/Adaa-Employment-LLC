import { FormEvent, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { usersApi } from "../../services/api/usersApi";
import { QUERY_KEYS } from "../../lib/constants";
import { Role } from "../../types/auth";
import { Modal } from "../ui/ReusableModal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  roles: Role[];
}

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  roleId: "",
};

export default function AddUserModal({
  isOpen,
  onClose,
  roles,
}: AddUserModalProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);

  const createMutation = useMutation({
    mutationFn: () =>
      usersApi.createUser({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
        roleId: Number(form.roleId),
      }),
    onSuccess: () => {
      toast.success("User added");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.search });
      setForm(emptyForm);
      onClose();
    },
    onError: (error: any) => {
      const message = error.response?.data?.message;
      toast.error(
        Array.isArray(message) ? message[0] : message || "Failed to add user",
      );
    },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.roleId) {
      toast.error("Select a role");
      return;
    }
    createMutation.mutate();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add user" size="md">
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
            Password
          </span>
          <Input
            type="password"
            value={form.password}
            onChange={(e) =>
              setForm((current) => ({ ...current, password: e.target.value }))
            }
            placeholder="At least 6 characters"
            required
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
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Adding..." : "Add user"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
