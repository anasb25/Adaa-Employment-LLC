import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { usersApi } from "../../services/api/usersApi";
import { QUERY_KEYS } from "../../lib/constants";
import UserCard from "./UserCard";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Pagination from "../ui/pagination/Pagination";
import { AlertIcon as SearchIcon } from "../../icons";
import { useSearch } from "../../hooks/useDebounce";

interface UserListProps {
  onCreateUser?: () => void;
}

export default function UserList({ onCreateUser }: UserListProps) {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const limit = 10;

  // Use the custom search hook with debouncing
  const {
    searchValue,
    debouncedSearchValue,
    handleSearchChange,
    clearSearch,
    isSearching,
  } = useSearch("", 300, () => {
    // Reset to first page when search changes
    setPage(1);
  });

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
    queryKey: [QUERY_KEYS.users.search, debouncedSearchValue, page, limit],
    queryFn: () => usersApi.searchUsers(debouncedSearchValue, page, limit),
    enabled: isSearching,
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

  const handleClearSearch = () => {
    clearSearch();
    setPage(1);
  };

  const currentData = isSearching ? searchData : usersData;
  const isLoadingData = isLoading || isSearchLoading;

  // Always render the search bar and main structure
  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search users by name or email..."
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        {isSearching && (
          <Button onClick={handleClearSearch} variant="outline" size="sm">
            Clear
          </Button>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="text-center py-8">
          <p className="text-red-600 dark:text-red-400 mb-4">
            Failed to load users
          </p>
          <Button onClick={() => refetch()} variant="outline">
            Try Again
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isLoadingData && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Empty State */}
      {!isLoadingData &&
        !error &&
        (!currentData?.data || currentData.data.length === 0) && (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <SearchIcon className="w-8 h-8" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {isSearching ? "No users found" : "No users available"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {isSearching
                ? `No users match "${debouncedSearchValue}". Try adjusting your search terms.`
                : "There are no users in the system yet."}
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
        )}

      {/* Users Grid */}
      {!isLoadingData &&
        !error &&
        currentData?.data &&
        currentData.data.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentData.data.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  onToggleStatus={handleToggleStatus}
                  isUpdating={updateStatusMutation.isPending}
                />
              ))}
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentData.page}
              totalPages={currentData.totalPages}
              totalItems={currentData.total}
              itemsPerPage={currentData.limit}
              onPageChange={setPage}
            />
          </>
        )}
    </div>
  );
}
