import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { skillsApi } from "../../services/api/skillsApi";
import { QUERY_KEYS } from "../../lib/constants";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Pagination from "../ui/pagination/Pagination";
import {
  AlertIcon as SearchIcon,
  PencilIcon,
  TrashBinIcon,
  PlusIcon,
} from "../../icons";
import { useSearch } from "../../hooks/useDebounce";
import { useConfirmDialog } from "../../providers/ConfirmDialogProvider";
import { Skill } from "../../types/skill";
import PermissionGuard from "../auth/PermissionGuard";

interface SkillListProps {
  onCreateSkill?: () => void;
  onEditSkill?: (skill: Skill) => void;
  totalSkills?: number;
}

export default function SkillList({
  onCreateSkill,
  onEditSkill,
  totalSkills = 0,
}: SkillListProps) {
  const confirmDialog = useConfirmDialog();
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
    setPage(1);
  });

  // Fetch skills with pagination
  const {
    data: skillsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [...QUERY_KEYS.skills.all, page, limit],
    queryFn: () => skillsApi.getSkills(page, limit),
    enabled: !isSearching,
  });

  // Search skills
  const { data: searchData, isLoading: isSearchLoading } = useQuery({
    queryKey: [...QUERY_KEYS.skills.search, debouncedSearchValue, page, limit],
    queryFn: () => skillsApi.searchSkills(debouncedSearchValue, page, limit),
    enabled: isSearching,
  });

  // Delete skill mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => skillsApi.deleteSkill(id),
    onSuccess: () => {
      toast.success("Skill deleted successfully!");
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.skills.all,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.skills.search,
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete skill");
    },
  });

  const handleEdit = useCallback(
    (skill: Skill) => {
      if (onEditSkill) {
        onEditSkill(skill);
      }
    },
    [onEditSkill],
  );

  const handleDelete = useCallback(
    async (skillId: number) => {
      const confirmed = await confirmDialog({
        title: "Delete Skill",
        message: "Are you sure you want to delete this skill?",
        confirmText: "Delete",
        variant: "warning",
      });
      if (confirmed) {
        deleteMutation.mutate(skillId);
      }
    },
    [confirmDialog, deleteMutation],
  );

  const handleClearSearch = useCallback(() => {
    clearSearch();
    setPage(1);
  }, [clearSearch]);

  const currentData = isSearching ? searchData : skillsData;
  const isLoadingData = isLoading || isSearchLoading;

  return (
    <div className="space-y-6">
      {/* Header with Search Bar and Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search skills by type or name..."
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

        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Total Skills: {totalSkills}
          </div>
          <PermissionGuard permission="skill:create">
            <Button onClick={onCreateSkill} startIcon={<PlusIcon />}>
              Create Skill
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="text-center py-8">
          <p className="text-red-600 dark:text-red-400 mb-4">
            Failed to load skills
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
              {isSearching ? "No skills found" : "No skills available"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {isSearching
                ? `No skills match "${debouncedSearchValue}". Try adjusting your search terms.`
                : "There are no skills in the system yet."}
            </p>
            {isSearching ? (
              <Button onClick={handleClearSearch} variant="outline">
                Clear Search
              </Button>
            ) : (
              onCreateSkill && (
                <Button onClick={onCreateSkill}>Create First Skill</Button>
              )
            )}
          </div>
        )}

      {/* Skills Table */}
      {!isLoadingData &&
        !error &&
        currentData?.data &&
        currentData.data.length > 0 && (
          <>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto">
                <Table>
                  {/* Table Header */}
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Skill Name
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Skill Type
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Employees Count
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHeader>

                  {/* Table Body */}
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {currentData.data.map((skill) => (
                      <TableRow key={skill.id}>
                        <TableCell className="px-5 py-4 sm:px-6 text-start">
                          <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {skill.skill}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {skill.skillType?.type || "—"}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {skill.employeeSkills?.length || 0}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <PermissionGuard permission="skill:update">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(skill)}
                                className="px-3 py-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
                                title="Edit Skill"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </Button>
                            </PermissionGuard>
                            <PermissionGuard permission="skill:delete">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(skill.id)}
                                disabled={
                                  deleteMutation.isPending &&
                                  deleteMutation.variables === skill.id
                                }
                                className="px-3 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                                title="Delete Skill"
                              >
                                <TrashBinIcon className="w-4 h-4" />
                              </Button>
                            </PermissionGuard>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
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
