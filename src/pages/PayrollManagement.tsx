import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { payrollApi } from "../services/api/payrollApi";
import { formatDecimalHours, roundDecimalHours } from "../utils/timeUtils";
import { formatAedAmount, formatAedRate } from "../utils/currency";
import { QUERY_KEYS } from "../lib/constants";
import { Payroll } from "../types/payroll";
import { filterAdaaPayrollRecords } from "../utils/adaaPayroll";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import PermissionGuard from "../components/auth/PermissionGuard";
import Button from "../components/ui/button/Button";
import Label from "../components/form/Label";
import Input from "../components/form/input/InputField";
import AllowanceDeductionImportModal from "../components/payroll/AllowanceDeductionImportModal";
import { airTicketsUsedInPayrollMonth } from "../utils/payrollAirTickets";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  PencilIcon,
  TrashBinIcon,
  BoltIcon,
  FileIcon,
  DownloadIcon,
  TableIcon,
  GridIcon,
} from "../icons";
import { useConfirmDialog } from "../providers/ConfirmDialogProvider";
import MonthPicker from "../components/form/MonthPicker";

/** All hour buckets counted in payroll / earnings (matches breakdown sum). */
function payrollTotalPaidHours(p: Payroll): number {
  return (
    (Number(p.totalHours) || 0) +
    (Number(p.totalOtHours) || 0) +
    (Number(p.totalOffdaysWorkedHours) || 0) +
    (Number(p.totalIdleDayHours) || 0)
  );
}

export default function PayrollManagement() {
  const queryClient = useQueryClient();
  const confirmDialog = useConfirmDialog();

  // Get current month as default
  const currentDate = new Date();
  const currentMonth = `${currentDate.getFullYear()}-${String(
    currentDate.getMonth() + 1,
  ).padStart(2, "0")}`;

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [expandedEmployees, setExpandedEmployees] = useState<Set<number>>(
    new Set(),
  );
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Fetch payroll data for selected month
  const { data: payrollData, isLoading } = useQuery({
    queryKey: QUERY_KEYS.payroll.byMonth(selectedMonth),
    queryFn: () => payrollApi.getPayrollsByMonth(selectedMonth),
    enabled: !!selectedMonth,
  });

  const adaaPayrollData = useMemo(
    () => filterAdaaPayrollRecords(payrollData),
    [payrollData],
  );

  const { data: payrollMonthTotals } = useQuery({
    queryKey: [...QUERY_KEYS.payroll.byMonth(selectedMonth), "totals"],
    queryFn: () => payrollApi.getPayrollMonthTotals(selectedMonth),
    enabled: !!selectedMonth,
  });

  const payrollSearchFiltered = useMemo(() => {
    if (!adaaPayrollData.length) return [];
    if (!searchQuery.trim()) return adaaPayrollData;
    const q = searchQuery.toLowerCase();
    return adaaPayrollData.filter((p: Payroll) => {
      const name = p.employee?.name?.toLowerCase() || "";
      const code = p.employee?.adaa_emp_code?.toLowerCase() || "";
      return name.includes(q) || code.includes(q);
    });
  }, [adaaPayrollData, searchQuery]);

  const showAirTicketUsedColumn = useMemo(
    () =>
      payrollSearchFiltered.some(
        (p) =>
          airTicketsUsedInPayrollMonth(
            p.month,
            p.employee?.air_tickets_history,
          ) > 0,
      ),
    [payrollSearchFiltered],
  );

  // Delete payroll mutation
  const deletePayrollMutation = useMutation({
    mutationFn: payrollApi.deletePayroll,
    onSuccess: () => {
      toast.success("Payroll entry deleted successfully!");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.payroll.all });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to delete payroll entry",
      );
    },
  });

  // Calculate payroll mutation
  const calculatePayrollMutation = useMutation({
    mutationFn: payrollApi.calculatePayrollForMonth,
    onSuccess: (data) => {
      toast.success(`Payroll calculated for ${data.length} ADAA employee(s)!`);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.payroll.all });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to calculate payroll",
      );
    },
  });

  const toggleEmployee = (employeeId: number) => {
    const newExpanded = new Set(expandedEmployees);
    if (newExpanded.has(employeeId)) {
      newExpanded.delete(employeeId);
    } else {
      newExpanded.add(employeeId);
    }
    setExpandedEmployees(newExpanded);
  };

  const handleDelete = async (payrollId: number) => {
    const confirmed = await confirmDialog({
      title: "Delete Payroll Entry",
      message:
        "Are you sure you want to delete this payroll entry? This action cannot be undone.",
      confirmText: "Delete",
      variant: "warning",
    });
    if (confirmed) {
      await deletePayrollMutation.mutateAsync(payrollId);
    }
  };

  const deleteManyMutation = useMutation({
    mutationFn: (ids: number[]) => payrollApi.deleteMany(ids),
    onSuccess: (data) => {
      toast.success(`${data.deleted} payroll(s) deleted successfully!`);
      setSelectedIds(new Set());
      setIsSelectMode(false);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.payroll.all });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete payrolls");
    },
  });

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    const confirmed = await confirmDialog({
      title: "Delete Payrolls",
      message: `Are you sure you want to delete ${selectedIds.size} payroll(s)?`,
      confirmText: "Delete",
      variant: "warning",
    });
    if (confirmed) {
      deleteManyMutation.mutate(Array.from(selectedIds));
    }
  };

  const handleCalculatePayroll = async () => {
    const confirmed = await confirmDialog({
      title: "Calculate Payroll",
      message: `Calculate payroll for ${selectedMonth}? This will process all approved timesheets and create/update payroll entries.`,
      confirmText: "Calculate",
      variant: "info",
    });
    if (confirmed) {
      await calculatePayrollMutation.mutateAsync(selectedMonth);
    }
  };

  const handleDownloadPDF = async (payroll: Payroll) => {
    const toastId = toast.loading("Generating PDF…");
    try {
      const blob = await payrollApi.downloadPayrollPdf(payroll.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const safe = (payroll.employee?.adaa_emp_code ?? "emp").replace(
        /[^\w\-]/g,
        "_",
      );
      link.download = `Payroll_${safe}_${payroll.month}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Payroll PDF downloaded", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Failed to download payroll PDF", { id: toastId });
    }
  };

  const formatCount = (value: number | null | undefined): string => {
    return Number(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const formatHours = (value: number): string => {
    return formatDecimalHours(Number(value) || 0);
  };

  const formatJsonDisplay = (data: Record<string, any> | null): string => {
    if (!data) return "N/A";
    const entries = Object.entries(data);
    if (entries.length === 0) return "N/A";
    return entries
      .map(([key, value]) => {
        const num = Number(value);
        if (!Number.isNaN(num) && value !== "" && value !== null) {
          return `${key}: ${formatAedAmount(num)}`;
        }
        return `${key}: ${value}`;
      })
      .join(", ");
  };

  const sumJsonValues = (data: Record<string, any> | null): number => {
    if (!data) return 0;
    return Object.values(data).reduce(
      (sum, val) => sum + (Number(val) || 0),
      0,
    );
  };

  const roundMoney = (value: number | null | undefined): number =>
    Math.round((Number(value) || 0) * 100) / 100;

  const PAYROLL_EXCEL_HOUR_COLUMNS = new Set([
    "Regular Hours",
    "OT Hours",
    "Off-Days Hours",
    "Idle Hours",
  ]);

  const PAYROLL_EXCEL_MONEY_COLUMNS = new Set([
    "Additional Allowances",
    "Absent Days Deduction",
    "Other Deductions",
    "Base Hourly Rate",
    "Total Gross Salary",
    "Net Salary",
  ]);

  const applyPayrollExcelNumberFormats = (worksheet: XLSX.WorkSheet): void => {
    if (!worksheet["!ref"]) return;
    const range = XLSX.utils.decode_range(worksheet["!ref"]);
    const headerByCol = new Map<number, string>();

    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: 0, c })];
      if (cell && typeof cell.v === "string") {
        headerByCol.set(c, cell.v);
      }
    }

    for (let r = range.s.r + 1; r <= range.e.r; r++) {
      for (let c = range.s.c; c <= range.e.c; c++) {
        const header = headerByCol.get(c);
        const ref = XLSX.utils.encode_cell({ r, c });
        const cell = worksheet[ref];
        if (!cell || typeof cell.v !== "number") continue;

        cell.t = "n";
        if (header && PAYROLL_EXCEL_HOUR_COLUMNS.has(header)) {
          cell.z = "0.##";
        } else if (header === "Air Ticket Used") {
          cell.z = "0";
        } else if (header && PAYROLL_EXCEL_MONEY_COLUMNS.has(header)) {
          cell.z = "#,##0.00";
        }
      }
    }
  };

  const handleExportToExcel = () => {
    if (!adaaPayrollData.length) {
      toast.error("No data to export");
      return;
    }

    const filteredData = payrollSearchFiltered;

    const anyAirTicketUsed = filteredData.some(
      (p) =>
        airTicketsUsedInPayrollMonth(
          p.month,
          p.employee?.air_tickets_history,
        ) > 0,
    );

    // Prepare data for Excel
    const excelData = filteredData.map((payroll: Payroll) => {
      const airUsed = airTicketsUsedInPayrollMonth(
        payroll.month,
        payroll.employee?.air_tickets_history,
      );
      const row: Record<string, string | number> = {
        "Employee Name": payroll.employee?.name || "N/A",
        "Employee Code": payroll.employee?.adaa_emp_code || "N/A",
        "Site Name": payroll.siteName || "",
        "Labor Trade": payroll.laborTrade || "",
        Month: payroll.month,
        "Regular Hours": roundDecimalHours(payroll.totalHours || 0),
        "OT Hours": roundDecimalHours(payroll.totalOtHours || 0),
        "Off-Days Hours": roundDecimalHours(payroll.totalOffdaysWorkedHours || 0),
        "Idle Hours": roundDecimalHours(payroll.totalIdleDayHours || 0),
        "Additional Allowances": roundMoney(sumJsonValues(payroll.allowances)),
        "Allowances Detail": formatJsonDisplay(payroll.allowances),
        "Absent Days Deduction": roundMoney(payroll.absentDaysDeductible),
      };
      if (anyAirTicketUsed) {
        row["Air Ticket Used"] = airUsed > 0 ? airUsed : 0;
      }
      row["Other Deductions"] = roundMoney(
        sumJsonValues(payroll.otherDeductions),
      );
      row["Deductions Detail"] = formatJsonDisplay(payroll.otherDeductions);
      row["Base Hourly Rate"] = roundMoney(payroll.baseHourlyRate);
      row["Total Gross Salary"] = roundMoney(payroll.totalGrossSalary);
      row["Net Salary"] = roundMoney(payroll.netSalary);
      row.Notes = payroll.notes || "";
      return row;
    });

    // Create worksheet (numeric cells are JS numbers so SUM/AVERAGE work in Excel)
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    applyPayrollExcelNumberFormats(worksheet);

    // Set column widths (omit Air Ticket Used when no usage in export)
    const columnWidths = [
      { wch: 20 },
      { wch: 15 },
      { wch: 28 },
      { wch: 18 },
      { wch: 10 },
      { wch: 12 },
      { wch: 12 },
      { wch: 14 },
      { wch: 12 },
      { wch: 20 },
      { wch: 30 },
      { wch: 20 },
      ...(anyAirTicketUsed ? [{ wch: 14 }] : []),
      { wch: 16 },
      { wch: 30 },
      { wch: 16 },
      { wch: 18 },
      { wch: 14 },
      { wch: 40 },
    ];
    worksheet["!cols"] = columnWidths;

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payroll");

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    // Download file
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Payroll_${selectedMonth}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);

    toast.success("Payroll data exported successfully!");
  };

  return (
    <PermissionGuard permissions={["payroll:read"]}>
      <PageMeta
        title="Payroll Management"
        description="Manage employee payroll by month"
      />

      <div className="space-y-6">
        <PageBreadcrumb pageTitle="Payroll Management" />

        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between"></div>

            <div className="flex items-end gap-4">
              <div className="w-64">
                <Label htmlFor="month">Select Month</Label>
                <MonthPicker
                  id="month"
                  value={selectedMonth}
                  onChange={(month) => {
                    setSelectedMonth(month);
                    setExpandedEmployees(new Set());
                  }}
                />
              </div>

              <PermissionGuard permissions={["payroll:create"]}>
                <Button
                  onClick={handleCalculatePayroll}
                  variant="primary"
                  disabled={calculatePayrollMutation.isPending}
                  startIcon={<BoltIcon />}
                >
                  {calculatePayrollMutation.isPending
                    ? "Calculating..."
                    : "Calculate Payroll"}
                </Button>
              </PermissionGuard>

              <PermissionGuard permissions={["payroll:update"]}>
                <Button
                  onClick={() => setIsImportModalOpen(true)}
                  variant="outline"
                  startIcon={<FileIcon />}
                >
                  Import Allowances/Deductions
                </Button>
              </PermissionGuard>

              <Button
                onClick={handleExportToExcel}
                variant="outline"
                startIcon={<DownloadIcon />}
                disabled={!adaaPayrollData.length}
              >
                Export to Excel
              </Button>

              <PermissionGuard permissions={["payroll:delete"]}>
                {!isSelectMode ? (
                  <Button
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                    onClick={() => setIsSelectMode(true)}
                  >
                    Delete Multiple
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedIds.size} selected
                    </span>
                    <Button
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                      onClick={handleDeleteSelected}
                      disabled={
                        selectedIds.size === 0 || deleteManyMutation.isPending
                      }
                    >
                      {deleteManyMutation.isPending
                        ? "Deleting..."
                        : "Confirm Delete"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsSelectMode(false);
                        setSelectedIds(new Set());
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </PermissionGuard>
            </div>
          </div>

          {/* Search Bar and View Toggle */}
          <div className="mt-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <Input
              type="text"
              placeholder="Search by Employee Name or ADAA Code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-96"
            />

            {/* View Mode Toggle and Export */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("card")}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                    viewMode === "card"
                      ? "bg-white dark:bg-gray-800 text-brand-600 dark:text-brand-400 shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                >
                  <GridIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">Cards</span>
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                    viewMode === "table"
                      ? "bg-white dark:bg-gray-800 text-brand-600 dark:text-brand-400 shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                >
                  <TableIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">Table</span>
                </button>
              </div>

              {viewMode === "table" &&
                adaaPayrollData.length > 0 && (
                  <Button
                    onClick={handleExportToExcel}
                    variant="outline"
                    size="sm"
                    startIcon={<DownloadIcon />}
                  >
                    Export to Excel
                  </Button>
                )}
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {adaaPayrollData.length} employee(s) found
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">
                Loading payroll data...
              </span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && adaaPayrollData.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12">
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400">
                No payroll data found for {selectedMonth}
              </p>
              <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
                Payroll calculations will be added here once processed.
              </p>
            </div>
          </div>
        )}

        {/* Grand Total Summary */}
        {!isLoading && adaaPayrollData.length > 0 && (
          (() => {
            const hasSearch = searchQuery.trim().length > 0;
            const filtered = payrollSearchFiltered;
            const totals = hasSearch
              ? filtered.reduce(
                  (acc, p) => {
                    acc.totalHours += Number(p.totalHours) || 0;
                    acc.totalOtHours += Number(p.totalOtHours) || 0;
                    acc.totalOffdaysWorkedHours +=
                      Number(p.totalOffdaysWorkedHours) || 0;
                    acc.totalIdleDayHours += Number(p.totalIdleDayHours) || 0;
                    acc.grossSalary += Number(p.totalGrossSalary) || 0;
                    acc.netSalary += Number(p.netSalary) || 0;
                    return acc;
                  },
                  {
                    totalHours: 0,
                    totalOtHours: 0,
                    totalOffdaysWorkedHours: 0,
                    totalIdleDayHours: 0,
                    grossSalary: 0,
                    netSalary: 0,
                  },
                )
              : {
                  totalHours: payrollMonthTotals?.totalHours ?? 0,
                  totalOtHours: payrollMonthTotals?.totalOtHours ?? 0,
                  totalOffdaysWorkedHours:
                    payrollMonthTotals?.totalOffdaysWorkedHours ?? 0,
                  totalIdleDayHours: payrollMonthTotals?.totalIdleDayHours ?? 0,
                  grossSalary: payrollMonthTotals?.grossSalary ?? 0,
                  netSalary: payrollMonthTotals?.netSalary ?? 0,
                };
            const totalPaidHoursAcrossEmployees = hasSearch
              ? totals.totalHours +
                totals.totalOtHours +
                totals.totalOffdaysWorkedHours +
                totals.totalIdleDayHours
              : (payrollMonthTotals?.totalPaidHours ?? 0);
            const employeeCount = hasSearch
              ? filtered.length
              : (payrollMonthTotals?.employeeCount ?? adaaPayrollData.length);
            return (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 border-brand-500 dark:border-brand-400 p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Grand Total ({employeeCount} employees)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                      Total Hours
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatHours(totalPaidHoursAcrossEmployees)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                      OT Hours
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatHours(totals.totalOtHours)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                      Off-Day Hours
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatHours(totals.totalOffdaysWorkedHours)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                      Idle Hours
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatHours(totals.totalIdleDayHours)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                      Gross Salary
                    </div>
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {formatAedAmount(totals.grossSalary)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                      Net Salary
                    </div>
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      {formatAedAmount(totals.netSalary)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()
        )}

        {/* Payroll List */}
        {!isLoading && adaaPayrollData.length > 0 && (
          <>
            {/* Table View */}
            {viewMode === "table" && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        {isSelectMode && (
                          <th className="px-4 py-3 w-10 bg-gray-50 dark:bg-gray-900">
                            <input
                              type="checkbox"
                              checked={
                                adaaPayrollData.length > 0 &&
                                adaaPayrollData.every((p: Payroll) =>
                                  selectedIds.has(p.id),
                                )
                              }
                              onChange={() => {
                                const allIds = adaaPayrollData.map(
                                  (p: Payroll) => p.id,
                                );
                                if (
                                  allIds.every((id: number) =>
                                    selectedIds.has(id),
                                  )
                                ) {
                                  setSelectedIds(new Set());
                                } else {
                                  setSelectedIds(new Set(allIds));
                                }
                              }}
                              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                            />
                          </th>
                        )}
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider sticky left-0 bg-gray-50 dark:bg-gray-900 z-10">
                          Employee
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Code
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Total Hrs
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          OT Hrs
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Off-Day Hrs
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Idle Hrs
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Base Rate/Hr
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Gross Salary
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Allowances
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Absent Deduct
                        </th>
                        {showAirTicketUsedColumn && (
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Air Ticket Used
                          </th>
                        )}
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Other Deduct
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Net Salary
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Notes
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider sticky right-0 bg-gray-50 dark:bg-gray-900 z-10">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {payrollSearchFiltered.map((payroll: Payroll) => {
                          const employee = payroll.employee;

                          return (
                            <tr
                              key={payroll.id}
                              className={`transition-colors ${
                                isSelectMode && selectedIds.has(payroll.id)
                                  ? "bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20"
                                  : "hover:bg-gray-50 dark:hover:bg-gray-700/30"
                              }`}
                            >
                              {isSelectMode && (
                                <td className="px-4 py-3 w-10">
                                  <input
                                    type="checkbox"
                                    checked={selectedIds.has(payroll.id)}
                                    onChange={() => toggleSelect(payroll.id)}
                                    className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                                  />
                                </td>
                              )}
                              <td className="px-4 py-3 whitespace-nowrap sticky left-0 bg-white dark:bg-gray-800 z-10">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {employee?.name || "Unknown"}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {employee?.adaa_emp_code || "N/A"}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right">
                                <div className="text-sm text-gray-900 dark:text-white">
                                  {formatHours(payrollTotalPaidHours(payroll))}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right">
                                <div className="text-sm text-gray-900 dark:text-white">
                                  {formatHours(payroll.totalOtHours)}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right">
                                <div className="text-sm text-gray-900 dark:text-white">
                                  {formatHours(payroll.totalOffdaysWorkedHours)}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right">
                                <div className="text-sm text-gray-900 dark:text-white">
                                  {formatHours(payroll.totalIdleDayHours)}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right">
                                <div className="text-sm text-gray-900 dark:text-white">
                                  {formatAedRate(payroll.baseHourlyRate || 0)}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right">
                                <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                  {formatAedAmount(payroll.totalGrossSalary || 0)}
                                </div>
                              </td>
                              <td className="px-4 py-3 max-w-xs">
                                <div
                                  className="text-sm text-gray-900 dark:text-white truncate"
                                  title={formatJsonDisplay(payroll.allowances)}
                                >
                                  {formatJsonDisplay(payroll.allowances)}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right">
                                <div className="text-sm text-red-600 dark:text-red-400">
                                  {formatCount(payroll.absentDaysDeductible)}
                                </div>
                              </td>
                              {showAirTicketUsedColumn && (
                                <td className="px-4 py-3 whitespace-nowrap text-right">
                                  <div className="text-sm text-gray-900 dark:text-white tabular-nums">
                                    {(() => {
                                      const n = airTicketsUsedInPayrollMonth(
                                        payroll.month,
                                        payroll.employee?.air_tickets_history,
                                      );
                                      return n > 0 ? n : "";
                                    })()}
                                  </div>
                                </td>
                              )}
                              <td className="px-4 py-3 max-w-xs">
                                <div
                                  className="text-sm text-gray-900 dark:text-white truncate"
                                  title={formatJsonDisplay(
                                    payroll.otherDeductions,
                                  )}
                                >
                                  {formatJsonDisplay(payroll.otherDeductions)}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right">
                                <div className="text-sm font-bold text-green-600 dark:text-green-400">
                                  {formatAedAmount(payroll.netSalary || 0)}
                                </div>
                              </td>
                              <td className="px-4 py-3 max-w-xs">
                                <div
                                  className="text-sm text-gray-600 dark:text-gray-400 truncate"
                                  title={payroll.notes || ""}
                                >
                                  {payroll.notes || "-"}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right text-sm sticky right-0 bg-white dark:bg-gray-800 z-10">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleDownloadPDF(payroll)}
                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                                    title="Download PDF"
                                  >
                                    <DownloadIcon className="w-4 h-4" />
                                  </button>
                                  <PermissionGuard
                                    permissions={["payroll:update"]}
                                  >
                                    <button
                                      onClick={() => {
                                        toast.info(
                                          "Edit functionality - calculations will be implemented as per your requirements",
                                        );
                                      }}
                                      className="text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                      title="Edit"
                                    >
                                      <PencilIcon className="w-4 h-4" />
                                    </button>
                                  </PermissionGuard>
                                  <PermissionGuard
                                    permissions={["payroll:delete"]}
                                  >
                                    <button
                                      onClick={() => handleDelete(payroll.id)}
                                      disabled={deletePayrollMutation.isPending}
                                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50"
                                      title="Delete"
                                    >
                                      <TrashBinIcon className="w-4 h-4" />
                                    </button>
                                  </PermissionGuard>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      {/* Grand Total Row */}
                      {(() => {
                        const filtered = payrollSearchFiltered;
                        const totals = filtered.reduce(
                          (acc: any, p: Payroll) => {
                            acc.totalHours += Number(p.totalHours) || 0;
                            acc.totalOtHours += Number(p.totalOtHours) || 0;
                            acc.totalOffdaysWorkedHours +=
                              Number(p.totalOffdaysWorkedHours) || 0;
                            acc.totalIdleDayHours +=
                              Number(p.totalIdleDayHours) || 0;
                            acc.grossSalary += Number(p.totalGrossSalary) || 0;
                            acc.absentDeduct +=
                              Number(p.absentDaysDeductible) || 0;
                            acc.airTicketsUsed +=
                              airTicketsUsedInPayrollMonth(
                                p.month,
                                p.employee?.air_tickets_history,
                              );
                            acc.netSalary += Number(p.netSalary) || 0;
                            return acc;
                          },
                          {
                            totalHours: 0,
                            totalOtHours: 0,
                            totalOffdaysWorkedHours: 0,
                            totalIdleDayHours: 0,
                            grossSalary: 0,
                            absentDeduct: 0,
                            airTicketsUsed: 0,
                            netSalary: 0,
                          },
                        );
                        const grandTotalPaidHours =
                          totals.totalHours +
                          totals.totalOtHours +
                          totals.totalOffdaysWorkedHours +
                          totals.totalIdleDayHours;
                        return (
                          <tr className="bg-gray-100 dark:bg-gray-900 font-bold border-t-2 border-gray-300 dark:border-gray-600">
                            <td className="px-4 py-3 whitespace-nowrap sticky left-0 bg-gray-100 dark:bg-gray-900 z-10 text-sm font-bold text-gray-900 dark:text-white">
                              Grand Total
                            </td>
                            <td className="px-4 py-3"></td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-bold text-gray-900 dark:text-white">
                              {formatHours(grandTotalPaidHours)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-bold text-gray-900 dark:text-white">
                              {formatHours(totals.totalOtHours)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-bold text-gray-900 dark:text-white">
                              {formatHours(totals.totalOffdaysWorkedHours)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-bold text-gray-900 dark:text-white">
                              {formatHours(totals.totalIdleDayHours)}
                            </td>
                            <td className="px-4 py-3"></td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-bold text-blue-600 dark:text-blue-400">
                              {formatAedAmount(totals.grossSalary)}
                            </td>
                            <td className="px-4 py-3"></td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-bold text-red-600 dark:text-red-400">
                              {formatCount(totals.absentDeduct)}
                            </td>
                            {showAirTicketUsedColumn && (
                              <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-bold text-gray-900 dark:text-white tabular-nums">
                                {totals.airTicketsUsed > 0
                                  ? totals.airTicketsUsed
                                  : ""}
                              </td>
                            )}
                            <td className="px-4 py-3"></td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-bold text-green-600 dark:text-green-400">
                              {formatAedAmount(totals.netSalary)}
                            </td>
                            <td className="px-4 py-3"></td>
                            <td className="px-4 py-3 sticky right-0 bg-gray-100 dark:bg-gray-900 z-10"></td>
                          </tr>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Card View */}
            {viewMode === "card" && (
              <div className="space-y-4">
                {payrollSearchFiltered.map((payroll: Payroll) => {
                    const isExpanded = expandedEmployees.has(
                      payroll.employeeId,
                    );

                    return (
                      <div
                        key={payroll.id}
                        className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border overflow-hidden ${
                          isSelectMode && selectedIds.has(payroll.id)
                            ? "border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/10"
                            : "border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        {/* Employee Header */}
                        <div className="flex items-center">
                          {isSelectMode && (
                            <div className="pl-4 flex items-center">
                              <input
                                type="checkbox"
                                checked={selectedIds.has(payroll.id)}
                                onChange={() => toggleSelect(payroll.id)}
                                className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                              />
                            </div>
                          )}
                          <button
                            onClick={() => toggleEmployee(payroll.employeeId)}
                            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className="flex-shrink-0">
                                {isExpanded ? (
                                  <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                                ) : (
                                  <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                                )}
                              </div>
                              <div className="text-left">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {payroll.employee?.name || "Unknown Employee"}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  ID: {payroll.employee?.adaa_emp_code || "N/A"}
                                </p>
                              </div>
                            </div>

                            <div
                              className="flex items-center gap-4"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="text-right">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  Total Hours: {formatHours(payrollTotalPaidHours(payroll))}
                                </div>
                              </div>
                            </div>
                          </button>
                        </div>

                        {/* Employee Details */}
                        {isExpanded && (
                          <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900/30">
                            {/* Net Salary - FIRST */}
                            {payroll.netSalary !== null &&
                              payroll.netSalary !== undefined && (
                                <div className="mb-6">
                                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-500 dark:border-green-600">
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <h4 className="text-lg font-semibold text-green-900 dark:text-green-100">
                                          Net Salary
                                        </h4>
                                        <p className="text-sm text-green-700 dark:text-green-300">
                                          Hours-based gross + additional
                                          allowances − deductions
                                        </p>
                                      </div>
                                      <div className="text-3xl font-bold text-green-700 dark:text-green-400">
                                        {formatAedAmount(payroll.netSalary)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                            {/* Hours Breakdown - SECOND */}
                            {payroll.hoursBreakdown ? (
                              <div className="space-y-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-wider border-b-2 border-gray-300 dark:border-gray-600 pb-2">
                                  Hours Breakdown
                                </h3>
                                {/* Regular Hours with Rate Variants */}
                                {payroll.hoursBreakdown.regular.length > 0 && (
                                  <div className="space-y-3">
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                                      Regular Working Hours
                                    </h4>
                                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                                          <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                              Rate Type
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                              Hours
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                              Rate/Hr
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                              Amount
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                          {payroll.hoursBreakdown.regular.map(
                                            (item, idx) => (
                                              <tr key={idx}>
                                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                                  {item.rateVariantName}
                                                  {item.additionalAmount !==
                                                    0 && (
                                                    <span className="ml-2 text-xs text-gray-500">
                                                      (+{formatAedRate(item.additionalAmount)})
                                                    </span>
                                                  )}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                                                  {formatHours(item.hours)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                                                  {formatAedRate(item.hourlyRate)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                                                  {formatAedAmount(item.amount)}
                                                </td>
                                              </tr>
                                            ),
                                          )}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}

                                {/* Special Days */}
                                {payroll.hoursBreakdown.specialDays.length >
                                  0 && (
                                  <div className="space-y-3">
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                                      Special Days
                                    </h4>
                                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                                          <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                              Special Day
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                              Hours
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                              Rate/Hr
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                              Amount
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                          {payroll.hoursBreakdown.specialDays.map(
                                            (item, idx) => (
                                              <tr key={idx}>
                                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                                  {item.specialDayName}
                                                  {item.additionalAmount !==
                                                    0 && (
                                                    <span className="ml-2 text-xs text-gray-500">
                                                      (+{formatAedRate(item.additionalAmount)})
                                                    </span>
                                                  )}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                                                  {formatHours(item.hours)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                                                  {formatAedRate(item.hourlyRate)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                                                  {formatAedAmount(item.amount)}
                                                </td>
                                              </tr>
                                            ),
                                          )}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}

                                {/* Off Days */}
                                {payroll.hoursBreakdown.offDays.length > 0 && (
                                  <div className="space-y-3">
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                                      Off Days Worked
                                    </h4>
                                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                                          <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                              Date
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                              Hours
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                              Rate/Hr
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                              Amount
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                          {payroll.hoursBreakdown.offDays.map(
                                            (item, idx) => (
                                              <tr key={idx}>
                                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                                  {new Date(
                                                    item.date,
                                                  ).toLocaleDateString()}
                                                  {item.additionalAmount !==
                                                    0 && (
                                                    <span className="ml-2 text-xs text-gray-500">
                                                      (
                                                      {item.additionalAmount > 0
                                                        ? "+"
                                                        : "-"}
                                                      {formatAedRate(
                                                        Math.abs(
                                                          item.additionalAmount,
                                                        ),
                                                      )}
                                                      )
                                                    </span>
                                                  )}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                                                  {formatHours(item.hours)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                                                  {formatAedRate(item.hourlyRate)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                                                  {formatAedAmount(item.amount)}
                                                </td>
                                              </tr>
                                            ),
                                          )}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}

                                {/* Idle Hours */}
                                {payroll.hoursBreakdown.idle.length > 0 && (
                                  <div className="space-y-3">
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                                      Idle Days
                                    </h4>
                                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                                          <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                              Date
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                              Hours
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                              Rate/Hr
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                              Amount
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                          {payroll.hoursBreakdown.idle.map(
                                            (item, idx) => (
                                              <tr key={idx}>
                                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                                  {new Date(
                                                    item.date,
                                                  ).toLocaleDateString()}
                                                  {item.additionalAmount !==
                                                    0 && (
                                                    <span className="ml-2 text-xs text-gray-500">
                                                      (
                                                      {item.additionalAmount > 0
                                                        ? "+"
                                                        : "-"}
                                                      {formatAedRate(
                                                        Math.abs(
                                                          item.additionalAmount,
                                                        ),
                                                      )}
                                                      )
                                                    </span>
                                                  )}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                                                  {formatHours(item.hours)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                                                  {formatAedRate(item.hourlyRate)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                                                  {formatAedAmount(item.amount)}
                                                </td>
                                              </tr>
                                            ),
                                          )}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-wider border-b-2 border-gray-300 dark:border-gray-600 pb-2">
                                  Hours Breakdown
                                </h3>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">
                                      Regular Hours:
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                      {formatHours(payroll.totalHours)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">
                                      OT Hours:
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                      {formatHours(payroll.totalOtHours)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">
                                      Off-days / Special Hours:
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                      {formatHours(
                                        payroll.totalOffdaysWorkedHours,
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">
                                      Idle Hours:
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                      {formatHours(payroll.totalIdleDayHours)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-700 font-semibold">
                                    <span className="text-gray-900 dark:text-white">
                                      Total Hours (matches timesheets):
                                    </span>
                                    <span className="text-gray-900 dark:text-white">
                                      {formatHours(
                                        (Number(payroll.totalHours) || 0) +
                                          (Number(payroll.totalOtHours) || 0) +
                                          (Number(
                                            payroll.totalOffdaysWorkedHours,
                                          ) || 0) +
                                          (Number(payroll.totalIdleDayHours) ||
                                            0),
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Additions/Deductions - THIRD */}
                            <div className="space-y-3 mb-6">
                              <h3 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-wider border-b-2 border-gray-300 dark:border-gray-600 pb-2">
                                Additions & Deductions
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Allowances & Arrears */}
                                <div className="space-y-3">
                                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                                    Additions
                                  </h4>
                                  <div className="space-y-2">
                                    <div>
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        Allowances:
                                      </span>
                                      <p className="text-sm text-gray-900 dark:text-white mt-1">
                                        {formatJsonDisplay(payroll.allowances)}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Deductions */}
                                <div className="space-y-3">
                                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                                    Deductions
                                  </h4>
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-600 dark:text-gray-400">
                                        Absent Days:
                                      </span>
                                      <span className="font-medium text-gray-900 dark:text-white">
                                        {formatCount(
                                          payroll.absentDaysDeductible,
                                        )}
                                      </span>
                                    </div>
                                    {airTicketsUsedInPayrollMonth(
                                      payroll.month,
                                      payroll.employee?.air_tickets_history,
                                    ) > 0 && (
                                      <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">
                                          Air Ticket Used:
                                        </span>
                                        <span className="font-medium text-gray-900 dark:text-white tabular-nums">
                                          {airTicketsUsedInPayrollMonth(
                                            payroll.month,
                                            payroll.employee
                                              ?.air_tickets_history,
                                          )}
                                        </span>
                                      </div>
                                    )}
                                    <div>
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        Other Deductions:
                                      </span>
                                      <p className="text-sm text-gray-900 dark:text-white mt-1">
                                        {formatJsonDisplay(
                                          payroll.otherDeductions,
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Total Gross Salary - FOURTH */}
                            <div className="mb-6">
                              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-500 dark:border-blue-600">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 uppercase tracking-wider">
                                      Total Gross Salary
                                    </h3>
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                      Base Rate:{" "}
                                      {formatAedRate(payroll.baseHourlyRate || 0)}
                                    </p>
                                  </div>
                                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                                    {formatAedAmount(
                                      payroll.totalGrossSalary || 0,
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Notes */}
                            {payroll.notes && (
                              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-2">
                                  Notes
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {payroll.notes}
                                </p>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                startIcon={<DownloadIcon />}
                                onClick={() => handleDownloadPDF(payroll)}
                              >
                                Download PDF
                              </Button>
                              <PermissionGuard permissions={["payroll:update"]}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  startIcon={<PencilIcon />}
                                  onClick={() => {
                                    toast.info(
                                      "Edit functionality - calculations will be implemented as per your requirements",
                                    );
                                  }}
                                >
                                  Edit
                                </Button>
                              </PermissionGuard>
                              <PermissionGuard permissions={["payroll:delete"]}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  startIcon={<TrashBinIcon />}
                                  onClick={() => handleDelete(payroll.id)}
                                  disabled={deletePayrollMutation.isPending}
                                >
                                  Delete
                                </Button>
                              </PermissionGuard>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Import Modal */}
      <AllowanceDeductionImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        selectedMonth={selectedMonth}
      />
    </PermissionGuard>
  );
}
