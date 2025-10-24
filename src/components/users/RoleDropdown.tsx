import { useState, useRef, useEffect } from "react";
import { Role } from "../../types/auth";
import { PencilIcon } from "../../icons";

interface RoleDropdownProps {
  currentRole: Role;
  availableRoles: Role[];
  onRoleChange: (roleId: number) => void;
  isUpdating?: boolean;
  disabled?: boolean;
}

export default function RoleDropdown({
  currentRole,
  availableRoles,
  onRoleChange,
  isUpdating = false,
  disabled = false,
}: RoleDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleRoleSelect = (roleId: number) => {
    onRoleChange(roleId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-900 dark:text-white">
          {currentRole.name.charAt(0).toUpperCase() + currentRole.name.slice(1)}
        </span>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled || isUpdating}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Change role"
        >
          <PencilIcon className="w-3 h-3" />
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10">
          <div className="py-1">
            {availableRoles.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => handleRoleSelect(role.id)}
                disabled={isUpdating}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed ${
                  role.id === currentRole.id
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    : "text-gray-900 dark:text-white"
                }`}
              >
                <div className="font-medium">{role.name}</div>
                {role.description && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {role.description}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
