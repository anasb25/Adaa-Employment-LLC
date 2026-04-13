import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "../../services/api/dashboardApi";
import { AlertIcon } from "../../icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Input from "../form/input/InputField";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "expired", label: "Expired" },
  { value: "expires_today", label: "Expires Today" },
  { value: "urgent", label: "Urgent (1-3 days)" },
  { value: "warning", label: "Warning (4-7 days)" },
  { value: "expiring_soon", label: "Expiring Soon (8-15 days)" },
];

export default function ExpiringDocumentsCard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: employees, isLoading, error } = useQuery({
    queryKey: ["dashboard", "expiring-documents"],
    queryFn: dashboardApi.getExpiringDocuments,
    refetchInterval: 5 * 60 * 1000,
  });

  const getUrgencyColor = (days: number) => {
    if (days < 0) return "text-red-700 dark:text-red-500";
    if (days === 0) return "text-red-600 dark:text-red-400";
    if (days <= 3) return "text-red-600 dark:text-red-400";
    if (days <= 7) return "text-orange-600 dark:text-orange-400";
    return "text-yellow-600 dark:text-yellow-400";
  };

  const getUrgencyBadge = (days: number) => {
    if (days < 0) return "bg-red-200 text-red-900 dark:bg-red-900/50 dark:text-red-200";
    if (days === 0) return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    if (days === 1) return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    if (days <= 3) return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    if (days <= 7) return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
    return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
  };

  const formatDaysBadge = (days: number) => {
    if (days < 0) {
      return `${Math.abs(days)} Days Expired`;
    }
    if (days === 0) {
      return "Expires Today";
    }
    if (days === 1) {
      return "1 Day";
    }
    return `${days} Days`;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  // Transform data into flat list and group by document type
  const getTableData = () => {
    if (!employees || employees.length === 0) return [];

    // Flatten all documents into rows
    const allRows: Array<{
      employeeId: number;
      name: string;
      adaa_emp_code: string;
      docType: string;
      expiryDate: string;
      daysUntilExpiry: number;
    }> = [];

    employees.forEach((employee) => {
      employee.expiringDocuments.forEach((doc) => {
        allRows.push({
          employeeId: employee.id,
          name: employee.name,
          adaa_emp_code: employee.adaa_emp_code,
          docType: doc.label,
          expiryDate: doc.expiryDate,
          daysUntilExpiry: doc.daysUntilExpiry,
        });
      });
    });

    // Group by document type
    const grouped = allRows.reduce((acc, row) => {
      if (!acc[row.docType]) {
        acc[row.docType] = [];
      }
      acc[row.docType].push(row);
      return acc;
    }, {} as Record<string, typeof allRows>);

    // Sort within each group by days (expired first, then by urgency)
    Object.keys(grouped).forEach((docType) => {
      grouped[docType].sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
    });

    // Define document type order
    const docTypeOrder = ['Passport', 'Emirates ID', 'Visa', 'Work Permit'];
    const orderedGroups = docTypeOrder
      .filter((type) => grouped[type])
      .map((type) => ({
        docType: type,
        rows: grouped[type],
      }));

    return orderedGroups;
  };

  const getStatusText = (days: number) => {
    if (days < 0) return "Expired";
    if (days === 0) return "Expires Today";
    if (days <= 3) return "Urgent";
    if (days <= 7) return "Warning";
    return "Expiring Soon";
  };

  const getStatusKey = (days: number) => {
    if (days < 0) return "expired";
    if (days === 0) return "expires_today";
    if (days <= 3) return "urgent";
    if (days <= 7) return "warning";
    return "expiring_soon";
  };

  const filteredTableData = useMemo(() => {
    const groups = getTableData();
    if (!searchTerm && !statusFilter && !dateFrom && !dateTo) return groups;

    const lowerSearch = searchTerm.toLowerCase();

    return groups
      .map((group) => ({
        ...group,
        rows: group.rows.filter((row) => {
          if (searchTerm) {
            const matchesName = row.name.toLowerCase().includes(lowerSearch);
            const matchesId = row.adaa_emp_code.toLowerCase().includes(lowerSearch);
            if (!matchesName && !matchesId) return false;
          }

          if (statusFilter && getStatusKey(row.daysUntilExpiry) !== statusFilter) {
            return false;
          }

          if (dateFrom || dateTo) {
            const expiry = new Date(row.expiryDate);
            if (dateFrom && expiry < new Date(dateFrom)) return false;
            if (dateTo && expiry > new Date(dateTo)) return false;
          }

          return true;
        }),
      }))
      .filter((group) => group.rows.length > 0);
  }, [employees, searchTerm, statusFilter, dateFrom, dateTo]);

  const totalFilteredCount = useMemo(
    () => filteredTableData.reduce((sum, g) => sum + g.rows.length, 0),
    [filteredTableData]
  );

  const hasActiveFilters = searchTerm || statusFilter || dateFrom || dateTo;

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setDateFrom("");
    setDateTo("");
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-gray-800 dark:bg-gray-800">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent dark:border-blue-400"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-gray-800 dark:bg-gray-800">
        <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
          <AlertIcon className="h-5 w-5" />
          <p className="dark:text-white">Failed to load expiring documents data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-gray-800 dark:bg-gray-800">
      <div className="border-b border-stroke px-6 py-4 dark:border-gray-700">
        <div className="flex flex-col gap-4">
          {/* Search and filters row */}
          <div className="flex flex-col lg:flex-row items-start lg:items-end gap-3">
            {/* Search bar */}
            <div className="w-full lg:max-w-sm">
              <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                Search
              </label>
              <div className="relative">
                <AlertIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status filter */}
            <div className="w-full lg:w-48">
              <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${
                  statusFilter ? "text-gray-800 dark:text-white/90" : "text-gray-400 dark:text-gray-400"
                }`}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="text-gray-700 dark:bg-gray-900 dark:text-gray-400">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date from */}
            <div className="w-full lg:w-44">
              <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                From
              </label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            {/* Date to */}
            <div className="w-full lg:w-44">
              <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                To
              </label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            {/* Result count + clear */}
            <div className="flex items-center gap-2 pb-2">
              {employees && employees.length > 0 && (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-sm font-medium text-white dark:bg-red-600">
                  {totalFilteredCount}
                </span>
              )}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-brand-500 hover:text-brand-600 dark:text-brand-400 whitespace-nowrap"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {!employees || employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <svg
                className="h-8 w-8 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h4 className="mb-2 text-lg font-semibold text-black dark:text-white">
              All Clear!
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No expired or expiring documents in the next 15 days
            </p>
          </div>
        ) : filteredTableData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No documents match your filters.
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-2 text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <div className="max-w-full overflow-x-auto max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                  <TableRow>
                    <TableCell
                      isHeader
                      className="px-4 py-3 font-semibold text-gray-700 text-start text-sm dark:text-gray-300"
                    >
                      Name
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 font-semibold text-gray-700 text-start text-sm dark:text-gray-300"
                    >
                      ID
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 font-semibold text-gray-700 text-start text-sm dark:text-gray-300"
                    >
                      Document
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 font-semibold text-gray-700 text-start text-sm dark:text-gray-300"
                    >
                      Expiry Date
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 font-semibold text-gray-700 text-start text-sm dark:text-gray-300"
                    >
                      Days Left
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 font-semibold text-gray-700 text-start text-sm dark:text-gray-300"
                    >
                      Status
                    </TableCell>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredTableData.map((group) => (
                    <React.Fragment key={group.docType}>
                      {/* Document Type Group Header */}
                      <TableRow className="bg-gray-100 dark:bg-gray-900/50">
                        <td
                          colSpan={6}
                          className="px-4 py-2 font-semibold text-gray-900 text-sm dark:text-white"
                        >
                          {group.docType}
                        </td>
                      </TableRow>
                      {/* Rows for this document type */}
                      {group.rows.map((row, idx) => (
                        <TableRow
                          key={`${row.employeeId}-${row.docType}-${idx}`}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                        >
                          <TableCell className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            {row.name}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {row.adaa_emp_code}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            {row.docType}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(row.expiryDate)}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${getUrgencyBadge(
                                row.daysUntilExpiry
                              )}`}
                            >
                              {formatDaysBadge(row.daysUntilExpiry)}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <span
                              className={`text-xs font-medium ${getUrgencyColor(row.daysUntilExpiry)}`}
                            >
                              {getStatusText(row.daysUntilExpiry)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

