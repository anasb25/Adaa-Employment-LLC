import React, { useMemo, useState } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { dashboardApi } from "../../services/api/dashboardApi";
import { QUERY_KEYS } from "../../lib/constants";
import { AlertIcon, DownloadIcon } from "../../icons";
import { downloadFile } from "../../utils/excelValidator";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import Select from "../form/Select";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "expired", label: "Expired" },
  { value: "expires_today", label: "Expires Today" },
  { value: "urgent", label: "Urgent (1-3 days)" },
  { value: "warning", label: "Warning (4-7 days)" },
  { value: "expiring_soon", label: "Expiring Soon (8-15 days)" },
];

type ExpiringDocumentsListProps = {
  maxTableHeight?: string;
  showViewAllLink?: boolean;
};

export function useExpiringDocumentsSummary(
  employees: Awaited<
    ReturnType<typeof dashboardApi.getExpiringDocuments>
  > | undefined,
) {
  return useMemo(() => {
    if (!employees?.length) {
      return {
        employees: 0,
        documents: 0,
        expired: 0,
        urgent: 0,
        warning: 0,
        expiringSoon: 0,
      };
    }

    let documents = 0;
    let expired = 0;
    let urgent = 0;
    let warning = 0;
    let expiringSoon = 0;

    for (const emp of employees) {
      for (const doc of emp.expiringDocuments) {
        documents++;
        const days = doc.daysUntilExpiry;
        if (days < 0) expired++;
        else if (days <= 3) urgent++;
        else if (days <= 7) warning++;
        else expiringSoon++;
      }
    }

    return {
      employees: employees.length,
      documents,
      expired,
      urgent,
      warning,
      expiringSoon,
    };
  }, [employees]);
}

export default function ExpiringDocumentsList({
  maxTableHeight = "600px",
  showViewAllLink = false,
}: ExpiringDocumentsListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: employees, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.dashboard.expiringDocuments,
    queryFn: dashboardApi.getExpiringDocuments,
    refetchInterval: 5 * 60 * 1000,
  });

  const summary = useExpiringDocumentsSummary(employees);

  const getUrgencyColor = (days: number) => {
    if (days < 0) return "text-red-700 dark:text-red-500";
    if (days === 0) return "text-red-600 dark:text-red-400";
    if (days <= 3) return "text-red-600 dark:text-red-400";
    if (days <= 7) return "text-orange-600 dark:text-orange-400";
    return "text-yellow-600 dark:text-yellow-400";
  };

  const getUrgencyBadge = (days: number) => {
    if (days < 0)
      return "bg-red-200 text-red-900 dark:bg-red-900/50 dark:text-red-200";
    if (days === 0)
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    if (days <= 3)
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    if (days <= 7)
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
    return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
  };

  const formatDaysBadge = (days: number) => {
    if (days < 0) return `${Math.abs(days)} Days Expired`;
    if (days === 0) return "Expires Today";
    if (days === 1) return "1 Day";
    return `${days} Days`;
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const getTableData = () => {
    if (!employees?.length) return [];

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

    const grouped = allRows.reduce(
      (acc, row) => {
        if (!acc[row.docType]) acc[row.docType] = [];
        acc[row.docType].push(row);
        return acc;
      },
      {} as Record<string, typeof allRows>,
    );

    Object.keys(grouped).forEach((docType) => {
      grouped[docType].sort(
        (a, b) => a.daysUntilExpiry - b.daysUntilExpiry,
      );
    });

    const docTypeOrder = ["Passport", "Emirates ID", "Visa", "Work Permit"];
    return docTypeOrder
      .filter((type) => grouped[type])
      .map((type) => ({ docType: type, rows: grouped[type] }));
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
            const matchesId = row.adaa_emp_code
              .toLowerCase()
              .includes(lowerSearch);
            if (!matchesName && !matchesId) return false;
          }
          if (
            statusFilter &&
            getStatusKey(row.daysUntilExpiry) !== statusFilter
          ) {
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
    [filteredTableData],
  );

  const hasActiveFilters = searchTerm || statusFilter || dateFrom || dateTo;

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setDateFrom("");
    setDateTo("");
  };

  const handleExportToExcel = () => {
    if (totalFilteredCount === 0) {
      toast.error("No data to export");
      return;
    }

    const excelData: Record<string, string>[] = [];
    filteredTableData.forEach((group) => {
      group.rows.forEach((row) => {
        excelData.push({
          "Employee Name": row.name,
          "Employee Code": row.adaa_emp_code,
          Document: row.docType,
          "Expiry Date": formatDate(row.expiryDate),
          "Days Left": formatDaysBadge(row.daysUntilExpiry),
          Status: getStatusText(row.daysUntilExpiry),
        });
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    worksheet["!cols"] = [
      { wch: 24 },
      { wch: 16 },
      { wch: 16 },
      { wch: 14 },
      { wch: 18 },
      { wch: 14 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expiry Alerts");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    downloadFile(
      blob,
      `expiry_documents_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
    toast.success("Expiry documents exported successfully");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
        <AlertIcon className="h-5 w-5 shrink-0" />
        <p>Failed to load expiring documents data</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800 dark:bg-red-900/40 dark:text-red-200">
          {summary.expired} expired
        </span>
        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-800 dark:bg-orange-900/40 dark:text-orange-200">
          {summary.urgent} urgent
        </span>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
          {summary.warning} warning
        </span>
        <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200">
          {summary.expiringSoon} expiring soon
        </span>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="w-full lg:max-w-sm">
          <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
            Search
          </label>
          <div className="relative">
            <AlertIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="w-full lg:w-48">
          <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
            Status
          </label>
          <Select
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="All Statuses"
          />
        </div>

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

        <div className="w-full shrink-0 lg:w-auto">
          <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
            Export
          </label>
          <div className="flex h-11 items-center gap-2">
            {employees && employees.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-11 shrink-0 py-0"
                  startIcon={<DownloadIcon className="h-4 w-4" />}
                  onClick={handleExportToExcel}
                  disabled={totalFilteredCount === 0}
                >
                  Export to Excel
                </Button>
                <span className="flex h-8 min-w-8 shrink-0 items-center justify-center rounded-full bg-red-500 px-2 text-sm font-medium text-white dark:bg-red-600">
                  {totalFilteredCount}
                </span>
              </>
            )}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="whitespace-nowrap text-xs text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {!employees?.length ? (
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
          <h4 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            All Clear!
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No expired or expiring documents in the next 15 days
          </p>
        </div>
      ) : filteredTableData.length === 0 ? (
        <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
          No documents match your filters.
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="ml-2 text-brand-500 hover:text-brand-600 dark:text-brand-400"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/50">
          <div
            className="max-w-full overflow-x-auto overflow-y-auto"
            style={{ maxHeight: maxTableHeight }}
          >
            <Table>
              <TableHeader className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                <TableRow>
                  <TableCell
                    isHeader
                    className="px-4 py-3 text-start text-sm font-semibold text-gray-700 dark:text-gray-300"
                  >
                    Name
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-4 py-3 text-start text-sm font-semibold text-gray-700 dark:text-gray-300"
                  >
                    ID
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-4 py-3 text-start text-sm font-semibold text-gray-700 dark:text-gray-300"
                  >
                    Document
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-4 py-3 text-start text-sm font-semibold text-gray-700 dark:text-gray-300"
                  >
                    Expiry Date
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-4 py-3 text-start text-sm font-semibold text-gray-700 dark:text-gray-300"
                  >
                    Days Left
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-4 py-3 text-start text-sm font-semibold text-gray-700 dark:text-gray-300"
                  >
                    Status
                  </TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredTableData.map((group) => (
                  <React.Fragment key={group.docType}>
                    <TableRow className="bg-gray-100 dark:bg-gray-900/50">
                      <td
                        colSpan={6}
                        className="px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white"
                      >
                        {group.docType}
                      </td>
                    </TableRow>
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
                            className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${getUrgencyBadge(row.daysUntilExpiry)}`}
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

      {showViewAllLink && employees && employees.length > 0 && (
        <div className="flex justify-end border-t border-gray-100 pt-4 dark:border-gray-800">
          <Link to="/expiry-alerts">
            <Button variant="outline" size="sm">
              Open full alerts page
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
