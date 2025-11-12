import { memo, useMemo } from "react";
import { User, Role } from "../../types/auth";
import { formatActivityTime } from "../../utils/timeUtils";
import Badge from "../ui/badge/Badge";
import Button from "../ui/button/Button";
import RoleDropdown from "./RoleDropdown";

interface UserCardProps {
  user: User;
  availableRoles: Role[];
  onToggleStatus: (userId: number, isActive: boolean) => void;
  onRoleChange: (userId: number, roleId: number) => void;
  isUpdating?: boolean;
  isRoleUpdating?: boolean;
  currentUserId?: number;
}

export default memo(function UserCard({
  user,
  availableRoles,
  onToggleStatus,
  onRoleChange,
  isUpdating,
  isRoleUpdating,
  currentUserId,
}: UserCardProps) {
  const isCurrentUser =
    currentUserId !== undefined && user.id === currentUserId;
  const shouldHideDeactivateButton = isCurrentUser && user.isActive;

  const handleToggleStatus = () => {
    onToggleStatus(user.id, !user.isActive);
  };

  const handleRoleChange = (roleId: number) => {
    onRoleChange(user.id, roleId);
  };

  const formatCreatedDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "Unknown";
    }
  };

  // Memoize expensive calculations
  const formattedCreatedDate = useMemo(
    () => formatCreatedDate(user.createdAt),
    [user.createdAt]
  );
  const formattedLastActivity = useMemo(
    () => formatActivityTime(user.lastActivity),
    [user.lastActivity]
  );

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <span className="text-lg font-semibold text-gray-600 dark:text-gray-300">
              {user.firstName.charAt(0)}
              {user.lastName.charAt(0)}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {user.firstName} {user.lastName}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {user.email}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge color={user.isActive ? "success" : "error"} size="sm">
            {user.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Role
          </p>
          <RoleDropdown
            currentRole={user.role}
            availableRoles={availableRoles}
            onRoleChange={handleRoleChange}
            isUpdating={isRoleUpdating}
          />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            User ID
          </p>
          <p className="text-sm text-gray-900 dark:text-white">#{user.id}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Last Activity
          </p>
          <p className="text-sm text-gray-900 dark:text-white">
            {formattedLastActivity}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Joined
          </p>
          <p className="text-sm text-gray-900 dark:text-white">
            {formattedCreatedDate}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {user.role.permissions?.length || 0} permissions
        </div>
        {!shouldHideDeactivateButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleStatus}
            disabled={isUpdating}
            className={
              user.isActive
                ? "text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                : "text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/20"
            }
          >
            {isUpdating
              ? "Updating..."
              : user.isActive
              ? "Deactivate"
              : "Activate"}
          </Button>
        )}
      </div>
    </div>
  );
});
