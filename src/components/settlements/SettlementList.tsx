import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { settlementsApi } from "../../services/api/settlementsApi";
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
import Badge from "../ui/badge/Badge";
import {
  AlertIcon as SearchIcon,
  PencilIcon,
  TrashBinIcon,
  PlusIcon,
  FileIcon as EyeIcon,
} from "../../icons";
import { useSearch } from "../../hooks/useDebounce";
import { Settlement, SettlementStatus } from "../../types/settlement";
import PermissionGuard from "../auth/PermissionGuard";

interface SettlementListProps {
  onCreateSettlement?: () => void;
  onEditSettlement?: (settlement: Settlement) => void;
  onViewSettlement?: (settlement: Settlement) => void;
  totalSettlements?: number;
}

export default function SettlementList({
  onCreateSettlement,
  onEditSettlement,
  onViewSettlement,
  totalSettlements = 0,
}: SettlementListProps) {
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

  // Fetch settlements with pagination
  const {
    data: settlementsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [...QUERY_KEYS.settlements.all, page, limit],
    queryFn: () => settlementsApi.getSettlements(page, limit),
    enabled: !isSearching,
  });

  // Search settlements
  const { data: searchData, isLoading: isSearchLoading } = useQuery({
    queryKey: [
      ...QUERY_KEYS.settlements.search,
      debouncedSearchValue,
      page,
      limit,
    ],
    queryFn: () =>
      settlementsApi.searchSettlements(debouncedSearchValue, page, limit),
    enabled: isSearching,
  });

  // Delete settlement mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => settlementsApi.deleteSettlement(id),
    onSuccess: () => {
      toast.success("Settlement deleted successfully!");
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.settlements.all,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.settlements.search,
      });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to delete settlement"
      );
    },
  });

  // Approve settlement mutation
  const approveMutation = useMutation({
    mutationFn: (id: number) => settlementsApi.approveSettlement(id),
    onSuccess: () => {
      toast.success("Settlement approved successfully!");
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.settlements.all,
      });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to approve settlement"
      );
    },
  });

  // Mark as paid mutation
  const markPaidMutation = useMutation({
    mutationFn: (id: number) => settlementsApi.markAsPaid(id),
    onSuccess: () => {
      toast.success("Settlement marked as paid!");
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.settlements.all,
      });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to mark settlement as paid"
      );
    },
  });

  const handleView = useCallback(
    (settlement: Settlement) => {
      if (onViewSettlement) {
        onViewSettlement(settlement);
      }
    },
    [onViewSettlement]
  );

  const handleEdit = useCallback(
    (settlement: Settlement) => {
      if (onEditSettlement) {
        onEditSettlement(settlement);
      }
    },
    [onEditSettlement]
  );

  const handleDelete = useCallback(
    (settlementId: number) => {
      if (
        window.confirm("Are you sure you want to delete this settlement?")
      ) {
        deleteMutation.mutate(settlementId);
      }
    },
    [deleteMutation]
  );

  const handleApprove = useCallback(
    (settlementId: number) => {
      if (
        window.confirm("Are you sure you want to approve this settlement?")
      ) {
        approveMutation.mutate(settlementId);
      }
    },
    [approveMutation]
  );

  const handleMarkPaid = useCallback(
    (settlementId: number) => {
      if (
        window.confirm("Are you sure you want to mark this settlement as paid?")
      ) {
        markPaidMutation.mutate(settlementId);
      }
    },
    [markPaidMutation]
  );

  const handleClearSearch = useCallback(() => {
    clearSearch();
    setPage(1);
  }, [clearSearch]);

  const currentData = isSearching ? searchData : settlementsData;
  const isLoadingData = isLoading || isSearchLoading;

  const getStatusBadgeColor = (status: SettlementStatus): "primary" | "success" | "error" | "warning" | "info" | "light" | "dark" => {
    switch (status) {
      case SettlementStatus.DRAFT:
        return "light";
      case SettlementStatus.PENDING_APPROVAL:
        return "warning";
      case SettlementStatus.APPROVED:
        return "success";
      case SettlementStatus.PAID:
        return "info";
      case SettlementStatus.CANCELLED:
        return "error";
      default:
        return "light";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Search Bar and Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search by employee name or code..."
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
            Total Settlements: {totalSettlements}
          </div>
          <PermissionGuard permission="settlement:create">
            <Button onClick={onCreateSettlement} startIcon={<PlusIcon />}>
              Create Settlement
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="text-center py-8">
          <p className="text-red-600 dark:text-red-400 mb-4">
            Failed to load settlements
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
              {isSearching ? "No settlements found" : "No settlements available"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {isSearching
                ? `No settlements match "${debouncedSearchValue}". Try adjusting your search terms.`
                : "There are no settlements in the system yet."}
            </p>
            {isSearching ? (
              <Button onClick={handleClearSearch} variant="outline">
                Clear Search
              </Button>
            ) : (
              onCreateSettlement && (
                <Button onClick={onCreateSettlement}>
                  Create First Settlement
                </Button>
              )
            )}
          </div>
        )}

      {/* Settlements Table */}
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
                        Employee Code
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Employee Name
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Last Date of Work
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Final Amount (AED)
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Status
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
                    {currentData.data.map((settlement) => (
                      <TableRow key={settlement.id}>
                        <TableCell className="px-5 py-4 sm:px-6 text-start">
                          <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {settlement.empCode}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {settlement.empName}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {formatDate(settlement.lastDateOfWork)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {Number(settlement.finalAmount).toFixed(2)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          <Badge
                            color={getStatusBadgeColor(settlement.status)}
                          >
                            {settlement.status.replace("_", " ").toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleView(settlement)}
                              className="px-3 py-1 text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/20"
                              title="View Settlement"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </Button>
                            {settlement.status ===
                              SettlementStatus.PENDING_APPROVAL && (
                              <PermissionGuard permission="settlement:approve">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleApprove(settlement.id)}
                                  className="px-3 py-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:text-purple-300 dark:hover:bg-purple-900/20"
                                  title="Approve"
                                >
                                  Approve
                                </Button>
                              </PermissionGuard>
                            )}
                            {settlement.status === SettlementStatus.APPROVED && (
                              <PermissionGuard permission="settlement:update">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleMarkPaid(settlement.id)}
                                  className="px-3 py-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
                                  title="Mark as Paid"
                                >
                                  Mark Paid
                                </Button>
                              </PermissionGuard>
                            )}
                            <PermissionGuard permission="settlement:update">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(settlement)}
                                className="px-3 py-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
                                title="Edit Settlement"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </Button>
                            </PermissionGuard>
                            <PermissionGuard permission="settlement:delete">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(settlement.id)}
                                disabled={
                                  deleteMutation.isPending &&
                                  deleteMutation.variables === settlement.id
                                }
                                className="px-3 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                                title="Delete Settlement"
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
