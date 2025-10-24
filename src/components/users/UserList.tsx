import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { usersApi } from "../../services/api/usersApi";
import { QUERY_KEYS } from "../../lib/constants";
import UserCard from "./UserCard";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import { AlertIcon as SearchIcon } from "../../icons";

interface UserListProps {
  onCreateUser?: () => void;
}

export default function UserList({ onCreateUser }: UserListProps) {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const queryClient = useQueryClient();

  const limit = 10;

  // Fetch users with pagination
  const {
    data: usersData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [QUERY_KEYS.users.all, page, limit],
    queryFn: () => usersApi.getUsers(page, limit),
    enabled: !isSearching,
  });

  // Search users
  const { data: searchData, isLoading: isSearchLoading } = useQuery({
    queryKey: [QUERY_KEYS.users.search, searchQuery, page, limit],
    queryFn: () => usersApi.searchUsers(searchQuery, page, limit),
    enabled: isSearching && searchQuery.length > 0,
  });

  // Update user status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: number; isActive: boolean }) =>
      usersApi.updateUserStatus(userId, { isActive }),
    onSuccess: (data) => {
      toast.success(data.message || "User status updated successfully!");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.search });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to update user status"
      );
    },
  });

  const handleToggleStatus = (userId: number, isActive: boolean) => {
    updateStatusMutation.mutate({ userId, isActive });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsSearching(query.length > 0);
    setPage(1); // Reset to first page when searching
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
    setPage(1);
  };

  const currentData = isSearching ? searchData : usersData;
  const isLoadingData = isLoading || isSearchLoading;

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400 mb-4">
          Failed to load users
        </p>
        <Button onClick={() => refetch()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentData?.users || currentData.users.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          {isSearching
            ? "No users found matching your search"
            : "No users found"}
        </p>
        {isSearching ? (
          <Button onClick={handleClearSearch} variant="outline">
            Clear Search
          </Button>
        ) : (
          onCreateUser && (
            <Button onClick={onCreateUser}>Create First User</Button>
          )
        )}
      </div>
    );
  }

  const totalPages = Math.ceil((currentData.total || 0) / limit);

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {isSearching && (
          <Button onClick={handleClearSearch} variant="outline" size="sm">
            Clear
          </Button>
        )}
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentData.users.map((user) => (
          <UserCard
            key={user.id}
            user={user}
            onToggleStatus={handleToggleStatus}
            isUpdating={updateStatusMutation.isPending}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing {(page - 1) * limit + 1} to{" "}
            {Math.min(page * limit, currentData.total || 0)} of{" "}
            {currentData.total || 0} users
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
