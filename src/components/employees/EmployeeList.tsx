import { useState, useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { employeesApi } from "../../services/api/employeesApi";
import { QUERY_KEYS } from "../../lib/constants";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import StarRating from "../ui/StarRating";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Pagination from "../ui/pagination/Pagination";
import {
  AlertIcon as SearchIcon,
  PencilIcon,
  TrashBinIcon,
  ChevronDownIcon,
} from "../../icons";
import { useSearch } from "../../hooks/useDebounce";
import { Employee, EmployeeStatus } from "../../types/employee";
import Checkbox from "../form/input/Checkbox";

interface EmployeeListProps {
  onCreateEmployee?: () => void;
  onEditEmployee?: (employee: Employee) => void;
}

const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return "N/A";
  }
};

// Define all available columns
interface ColumnDefinition {
  key: string;
  label: string;
  defaultVisible: boolean;
  render: (employee: Employee) => React.ReactNode;
}

export default function EmployeeList({
  onCreateEmployee,
  onEditEmployee,
}: EmployeeListProps) {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const [showColumnSelector, setShowColumnSelector] = useState(false);

  const limit = 10;

  // Delete employee mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => employeesApi.deleteEmployee(id),
    onSuccess: () => {
      toast.success("Employee deleted successfully!");
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.employees.all,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.employees.search,
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete employee");
    },
  });

  const handleEdit = useCallback(
    (employee: Employee) => {
      if (onEditEmployee) {
        onEditEmployee(employee);
      }
    },
    [onEditEmployee]
  );

  const handleDelete = useCallback(
    (employeeId: number) => {
      if (window.confirm("Are you sure you want to delete this employee?")) {
        deleteMutation.mutate(employeeId);
      }
    },
    [deleteMutation]
  );

  // Define all columns
  const allColumns: ColumnDefinition[] = useMemo(
    () => [
      {
        key: "employee",
        label: "Employee",
        defaultVisible: true,
        render: (employee: Employee) => (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-brand-600 dark:text-brand-400">
                {employee.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                {employee.name}
              </span>
              <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                {employee.adaa_emp_code}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "dob",
        label: "Date of Birth",
        defaultVisible: false,
        render: (employee: Employee) => formatDate(employee.dob),
      },
      {
        key: "contact",
        label: "Contact Number",
        defaultVisible: true,
        render: (employee: Employee) =>
          employee.contact_no || (
            <span className="text-gray-400 dark:text-gray-500">N/A</span>
          ),
      },
      {
        key: "nationality",
        label: "Nationality",
        defaultVisible: true,
        render: (employee: Employee) =>
          employee.nationality || (
            <span className="text-gray-400 dark:text-gray-500">N/A</span>
          ),
      },
      {
        key: "personal_code",
        label: "Personal Code",
        defaultVisible: false,
        render: (employee: Employee) =>
          employee.personal_code || (
            <span className="text-gray-400 dark:text-gray-500">N/A</span>
          ),
      },
      {
        key: "pp_no",
        label: "Passport Number",
        defaultVisible: false,
        render: (employee: Employee) =>
          employee.pp_no || (
            <span className="text-gray-400 dark:text-gray-500">N/A</span>
          ),
      },
      {
        key: "pp_expiry",
        label: "Passport Expiry",
        defaultVisible: false,
        render: (employee: Employee) => formatDate(employee.pp_expiry),
      },
      {
        key: "emirates_id",
        label: "Emirates ID",
        defaultVisible: true,
        render: (employee: Employee) =>
          employee.emirates_id || (
            <span className="text-gray-400 dark:text-gray-500">N/A</span>
          ),
      },
      {
        key: "emirates_id_expiry",
        label: "Emirates ID Expiry",
        defaultVisible: false,
        render: (employee: Employee) => formatDate(employee.emirates_id_expiry),
      },
      {
        key: "visa_expiry",
        label: "Visa Expiry",
        defaultVisible: false,
        render: (employee: Employee) => formatDate(employee.visa_expiry),
      },
      {
        key: "work_permit_no",
        label: "Work Permit Number",
        defaultVisible: false,
        render: (employee: Employee) =>
          employee.work_permit_no || (
            <span className="text-gray-400 dark:text-gray-500">N/A</span>
          ),
      },
      {
        key: "work_permit_expiry",
        label: "Work Permit Expiry",
        defaultVisible: false,
        render: (employee: Employee) => formatDate(employee.work_permit_expiry),
      },
      {
        key: "date_of_joining",
        label: "Date of Joining",
        defaultVisible: true,
        render: (employee: Employee) => formatDate(employee.date_of_joining),
      },
      {
        key: "date_of_arrival",
        label: "Date of Arrival",
        defaultVisible: false,
        render: (employee: Employee) => formatDate(employee.date_of_arrival),
      },
      {
        key: "status",
        label: "Status",
        defaultVisible: true,
        render: (employee: Employee) => (
          <Badge
            size="sm"
            color={
              employee.status === EmployeeStatus.ACTIVE ? "success" : "warning"
            }
          >
            {employee.status === EmployeeStatus.ACTIVE
              ? "Active"
              : "On Vacation"}
          </Badge>
        ),
      },
      {
        key: "skills",
        label: "Skills",
        defaultVisible: true,
        render: (employee: Employee) => (
          <div className="flex flex-col gap-2">
            {employee.employeeSkills && employee.employeeSkills.length > 0 ? (
              <>
                {employee.employeeSkills.slice(0, 3).map((es) => (
                  <div
                    key={es.id}
                    className="flex items-center gap-1.5 text-sm"
                  >
                    <span className="text-gray-800 dark:text-white/90">
                      {es.skill.skill}
                    </span>
                    <StarRating rating={es.rating} maxRating={5} size="sm" />
                  </div>
                ))}
                {employee.employeeSkills.length > 3 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    +{employee.employeeSkills.length - 3} more
                  </span>
                )}
              </>
            ) : (
              <span className="text-gray-400 dark:text-gray-500 text-xs">
                No skills
              </span>
            )}
          </div>
        ),
      },
      {
        key: "actions",
        label: "Actions",
        defaultVisible: true,
        render: (employee: Employee) => (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(employee)}
              className="px-3 py-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
            >
              <PencilIcon className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDelete(employee.id)}
              disabled={
                deleteMutation.isPending &&
                deleteMutation.variables === employee.id
              }
              className="px-3 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
            >
              <TrashBinIcon className="w-4 h-4" />
            </Button>
          </div>
        ),
      },
    ],
    [
      handleEdit,
      handleDelete,
      deleteMutation.isPending,
      deleteMutation.variables,
    ]
  );

  // Load column visibility from localStorage or use defaults
  const getInitialVisibility = () => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("employee-columns-visibility");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // Fallback to defaults if parsing fails
        }
      }
    }
    // Return default visibility
    const visibility: Record<string, boolean> = {};
    allColumns.forEach((col) => {
      visibility[col.key] = col.defaultVisible;
    });
    return visibility;
  };

  const [columnVisibility, setColumnVisibility] =
    useState<Record<string, boolean>>(getInitialVisibility);

  // Save visibility to localStorage whenever it changes
  const updateColumnVisibility = (key: string, visible: boolean) => {
    const newVisibility = { ...columnVisibility, [key]: visible };
    setColumnVisibility(newVisibility);
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "employee-columns-visibility",
        JSON.stringify(newVisibility)
      );
    }
  };

  // Get visible columns
  const visibleColumns = useMemo(
    () => allColumns.filter((col) => columnVisibility[col.key] !== false),
    [allColumns, columnVisibility]
  );

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

  // Fetch employees with pagination
  const {
    data: employeesData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [...QUERY_KEYS.employees.all, page, limit],
    queryFn: () => employeesApi.getEmployees(page, limit),
    enabled: !isSearching,
  });

  // Search employees
  const { data: searchData, isLoading: isSearchLoading } = useQuery({
    queryKey: [
      ...QUERY_KEYS.employees.search,
      debouncedSearchValue,
      page,
      limit,
    ],
    queryFn: () =>
      employeesApi.searchEmployees(debouncedSearchValue, page, limit),
    enabled: isSearching,
  });

  const handleClearSearch = useCallback(() => {
    clearSearch();
    setPage(1);
  }, [clearSearch]);

  const currentData = isSearching ? searchData : employeesData;
  const isLoadingData = isLoading || isSearchLoading;

  return (
    <div className="space-y-6">
      {/* Search Bar and Column Selector */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search employees by name, code, ID, or contact..."
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
        {/* Column Visibility Toggle */}
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowColumnSelector(!showColumnSelector)}
            className="flex items-center gap-2"
          >
            Columns
            <ChevronDownIcon
              className={`w-4 h-4 transition-transform ${
                showColumnSelector ? "rotate-180" : ""
              }`}
            />
          </Button>

          {/* Column Selector Dropdown */}
          {showColumnSelector && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg z-50 max-h-96 overflow-y-auto">
              <div className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Show Columns
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const allVisible: Record<string, boolean> = {};
                      allColumns.forEach((col) => {
                        allVisible[col.key] = true;
                      });
                      setColumnVisibility(allVisible);
                      if (typeof window !== "undefined") {
                        localStorage.setItem(
                          "employee-columns-visibility",
                          JSON.stringify(allVisible)
                        );
                      }
                    }}
                    className="text-xs px-2 py-1"
                  >
                    Show All
                  </Button>
                </div>
                <div className="space-y-2">
                  {allColumns.map((column) => (
                    <label
                      key={column.key}
                      className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <Checkbox
                        checked={columnVisibility[column.key] !== false}
                        onChange={(checked) =>
                          updateColumnVisibility(column.key, checked)
                        }
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {column.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close column selector */}
      {showColumnSelector && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowColumnSelector(false)}
        />
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-8">
          <p className="text-red-600 dark:text-red-400 mb-4">
            Failed to load employees
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
              {isSearching ? "No employees found" : "No employees available"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {isSearching
                ? `No employees match "${debouncedSearchValue}". Try adjusting your search terms.`
                : "There are no employees in the system yet."}
            </p>
            {isSearching ? (
              <Button onClick={handleClearSearch} variant="outline">
                Clear Search
              </Button>
            ) : (
              onCreateEmployee && (
                <Button onClick={onCreateEmployee}>
                  Create First Employee
                </Button>
              )
            )}
          </div>
        )}

      {/* Employees Table */}
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
                      {visibleColumns.map((column) => (
                        <TableCell
                          key={column.key}
                          isHeader
                          className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                        >
                          {column.label}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHeader>

                  {/* Table Body */}
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {currentData.data.map((employee) => (
                      <TableRow key={employee.id}>
                        {visibleColumns.map((column) => (
                          <TableCell
                            key={column.key}
                            className={`px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400 ${
                              column.key === "employee" ||
                              column.key === "status"
                                ? "px-5 py-4 sm:px-6"
                                : ""
                            } ${
                              column.key === "status" ||
                              column.key === "actions"
                                ? ""
                                : ""
                            }`}
                          >
                            {column.render(employee)}
                          </TableCell>
                        ))}
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
