import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { payrollApi } from "../services/api/payrollApi";
import { QUERY_KEYS } from "../lib/constants";
import { Payroll } from "../types/payroll";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import PermissionGuard from "../components/auth/PermissionGuard";
import Button from "../components/ui/button/Button";
import Label from "../components/form/Label";
import Input from "../components/form/input/InputField";
import AllowanceDeductionImportModal from "../components/payroll/AllowanceDeductionImportModal";
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

export default function PayrollManagement() {
  const queryClient = useQueryClient();

  // Get current month as default
  const currentDate = new Date();
  const currentMonth = `${currentDate.getFullYear()}-${String(
    currentDate.getMonth() + 1
  ).padStart(2, "0")}`;

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [expandedEmployees, setExpandedEmployees] = useState<Set<number>>(
    new Set()
  );
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");

  // Fetch payroll data for selected month
  const { data: payrollData, isLoading } = useQuery({
    queryKey: QUERY_KEYS.payroll.byMonth(selectedMonth),
    queryFn: () => payrollApi.getPayrollsByMonth(selectedMonth),
    enabled: !!selectedMonth,
  });

  // Delete payroll mutation
  const deletePayrollMutation = useMutation({
    mutationFn: payrollApi.deletePayroll,
    onSuccess: () => {
      toast.success("Payroll entry deleted successfully!");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.payroll.all });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to delete payroll entry"
      );
    },
  });

  // Calculate payroll mutation
  const calculatePayrollMutation = useMutation({
    mutationFn: payrollApi.calculatePayrollForMonth,
    onSuccess: (data) => {
      toast.success(`Payroll calculated for ${data.length} employee(s)!`);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.payroll.all });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to calculate payroll"
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
    if (
      window.confirm(
        "Are you sure you want to delete this payroll entry? This action cannot be undone."
      )
    ) {
      await deletePayrollMutation.mutateAsync(payrollId);
    }
  };

  const handleCalculatePayroll = async () => {
    if (
      window.confirm(
        `Calculate payroll for ${selectedMonth}? This will process all approved timesheets and create/update payroll entries.`
      )
    ) {
      await calculatePayrollMutation.mutateAsync(selectedMonth);
    }
  };

  const handleDownloadPDF = (payroll: Payroll) => {
    // Create a print-friendly window
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to download PDF");
      return;
    }

    const employee = payroll.employee;
    const employeeSalaryTotal =
      (Number(employee?.basic_salary) || 0) +
      (Number(employee?.hra) || 0) +
      (Number(employee?.other_allowance) || 0);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payroll - ${
          employee?.name || "Employee"
        } - ${selectedMonth}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { margin: 0; color: #333; }
          .header p { margin: 5px 0; color: #666; }
          .section { margin: 20px 0; }
          .section-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; background: #f5f5f5; padding: 8px; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th, td { padding: 8px; text-align: left; border: 1px solid #ddd; }
          th { background: #f5f5f5; font-weight: bold; }
          .total-row { font-weight: bold; background: #f9f9f9; }
          .salary-box { background: #e8f5e9; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .gross-box { background: #e3f2fd; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .net-box { background: #c8e6c9; padding: 15px; margin: 10px 0; border-radius: 5px; font-size: 18px; font-weight: bold; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>PAYROLL STATEMENT</h1>
          <p>Month: ${selectedMonth}</p>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
        </div>

        <div class="section">
          <h2>Employee Information</h2>
          <table>
            <tr><th>Name</th><td>${employee?.name || "N/A"}</td></tr>
            <tr><th>Employee Code</th><td>${
              employee?.adaa_emp_code || "N/A"
            }</td></tr>
            <tr><th>Month</th><td>${payroll.month}</td></tr>
          </table>
        </div>

        <div class="net-box">
          NET SALARY: AED ${formatNumber(payroll.netSalary || 0)}
          <div style="font-size: 12px; font-weight: normal; margin-top: 5px;">Gross salary + allowances + deductions</div>
        </div>

        <div class="section">
          <div class="section-title">Hours & Earnings</div>
          <table>
            <tr><th>Type</th><th>Hours</th></tr>
            <tr><td>Regular Hours</td><td>${formatNumber(
              payroll.totalHours
            )}</td></tr>
            <tr><td>Overtime Hours</td><td>${formatNumber(
              payroll.totalOtHours
            )}</td></tr>
            <tr><td>Off Days Worked Hours</td><td>${formatNumber(
              payroll.totalOffdaysWorkedHours
            )}</td></tr>
            <tr><td>Idle Hours</td><td>${formatNumber(
              payroll.totalIdleDayHours
            )}</td></tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Fixed Monthly Salary</div>
          <table>
            <tr><th>Component</th><th>Amount (AED)</th></tr>
            <tr><td>Basic Salary</td><td>${formatNumber(
              Number(employee?.basic_salary) || 0
            )}</td></tr>
            <tr><td>HRA</td><td>${formatNumber(
              Number(employee?.hra) || 0
            )}</td></tr>
            <tr><td>Other Allowance</td><td>${formatNumber(
              Number(employee?.other_allowance) || 0
            )}</td></tr>
            <tr class="total-row"><td>Monthly Salary Total</td><td>${formatNumber(
              employeeSalaryTotal
            )}</td></tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Additional Allowances</div>
          ${
            payroll.allowances && Object.keys(payroll.allowances).length > 0
              ? `<table>
                  <tr><th>Description</th><th>Amount (AED)</th></tr>
                  ${Object.entries(payroll.allowances)
                    .map(
                      ([key, value]) =>
                        `<tr><td>${key}</td><td>${formatNumber(
                          Number(value)
                        )}</td></tr>`
                    )
                    .join("")}
                </table>`
              : "<p>No additional allowances</p>"
          }
        </div>

        <div class="section">
          <div class="section-title">Deductions</div>
          <table>
            <tr><th>Description</th><th>Amount (AED)</th></tr>
            <tr><td>Absent Days Deductible</td><td>${formatNumber(
              payroll.absentDaysDeductible
            )}</td></tr>
            ${
              payroll.otherDeductions &&
              Object.keys(payroll.otherDeductions).length > 0
                ? Object.entries(payroll.otherDeductions)
                    .map(
                      ([key, value]) =>
                        `<tr><td>${key}</td><td>${formatNumber(
                          Number(value)
                        )}</td></tr>`
                    )
                    .join("")
                : ""
            }
          </table>
        </div>

        <div class="gross-box">
          <strong>TOTAL GROSS SALARY:</strong> AED ${formatNumber(
            payroll.totalGrossSalary || 0
          )}
          <div style="font-size: 12px; margin-top: 5px;">Base Rate: AED ${formatNumber(
            payroll.baseHourlyRate || 0
          )}/hr</div>
        </div>

        ${
          payroll.notes
            ? `<div class="section"><strong>Notes:</strong><p>${payroll.notes}</p></div>`
            : ""
        }

        <div style="margin-top: 40px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">Print / Save as PDF</button>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const formatNumber = (value: number): string => {
    return Number(value).toFixed(2);
  };

  const formatJsonDisplay = (data: Record<string, any> | null): string => {
    if (!data) return "N/A";
    const entries = Object.entries(data);
    if (entries.length === 0) return "N/A";
    return entries.map(([key, value]) => `${key}: ${value}`).join(", ");
  };

  const sumJsonValues = (data: Record<string, any> | null): number => {
    if (!data) return 0;
    return Object.values(data).reduce(
      (sum, val) => sum + (Number(val) || 0),
      0
    );
  };

  const handleExportToExcel = () => {
    if (!payrollData || payrollData.length === 0) {
      toast.error("No data to export");
      return;
    }

    const filteredData = payrollData.filter((payroll: Payroll) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      const employeeName = payroll.employee?.name?.toLowerCase() || "";
      const employeeCode = payroll.employee?.adaa_emp_code?.toLowerCase() || "";
      return employeeName.includes(query) || employeeCode.includes(query);
    });

    // Prepare data for Excel
    const excelData = filteredData.map((payroll: Payroll) => ({
      "Employee Name": payroll.employee?.name || "N/A",
      "Employee Code": payroll.employee?.adaa_emp_code || "N/A",
      Month: payroll.month,
      "Regular Hours": Number(payroll.totalHours || 0).toFixed(2),
      "OT Hours": Number(payroll.totalOtHours || 0).toFixed(2),
      "Off-Days Hours": Number(payroll.totalOffdaysWorkedHours || 0).toFixed(2),
      "Idle Hours": Number(payroll.totalIdleDayHours || 0).toFixed(2),
      "Basic Salary": Number(payroll.employee?.basic_salary || 0).toFixed(2),
      HRA: Number(payroll.employee?.hra || 0).toFixed(2),
      "Other Allowance": Number(payroll.employee?.other_allowance || 0).toFixed(
        2
      ),
      "Fixed Monthly Salary": (
        (Number(payroll.employee?.basic_salary) || 0) +
        (Number(payroll.employee?.hra) || 0) +
        (Number(payroll.employee?.other_allowance) || 0)
      ).toFixed(2),
      "Additional Allowances": sumJsonValues(payroll.allowances).toFixed(2),
      "Allowances Detail": formatJsonDisplay(payroll.allowances),
      "Absent Days Deduction": Number(
        payroll.absentDaysDeductible || 0
      ).toFixed(2),
      "Other Deductions": sumJsonValues(payroll.otherDeductions).toFixed(2),
      "Deductions Detail": formatJsonDisplay(payroll.otherDeductions),
      "Base Hourly Rate": Number(payroll.baseHourlyRate || 0).toFixed(2),
      "Total Gross Salary": Number(payroll.totalGrossSalary || 0).toFixed(2),
      "Net Salary": Number(payroll.netSalary || 0).toFixed(2),
      Notes: payroll.notes || "",
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const columnWidths = [
      { wch: 20 }, // Employee Name
      { wch: 15 }, // Employee Code
      { wch: 10 }, // Month
      { wch: 12 }, // Regular Hours
      { wch: 12 }, // OT Hours
      { wch: 14 }, // Off-Days Hours
      { wch: 12 }, // Idle Hours
      { wch: 14 }, // Basic Salary
      { wch: 12 }, // HRA
      { wch: 16 }, // Other Allowance
      { wch: 18 }, // Fixed Monthly Salary
      { wch: 20 }, // Additional Allowances
      { wch: 30 }, // Allowances Detail
      { wch: 20 }, // Absent Days Deduction
      { wch: 16 }, // Other Deductions
      { wch: 30 }, // Deductions Detail
      { wch: 16 }, // Base Hourly Rate
      { wch: 18 }, // Total Gross Salary
      { wch: 14 }, // Net Salary
      { wch: 40 }, // Notes
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Payroll Management
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  View and manage employee payroll for the selected month
                </p>
              </div>
            </div>

            <div className="flex items-end gap-4">
              <div className="w-64">
                <Label htmlFor="month">Select Month</Label>
                <input
                  id="month"
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    setExpandedEmployees(new Set());
                  }}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-brand-500 focus:border-transparent"
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
                disabled={!payrollData || payrollData.length === 0}
              >
                Export to Excel
              </Button>
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
                payrollData &&
                payrollData.length > 0 && (
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
              {payrollData?.length || 0} employee(s) found
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
        {!isLoading && (!payrollData || payrollData.length === 0) && (
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
        {!isLoading && payrollData && payrollData.length > 0 && (() => {
          const filtered = payrollData.filter((p: Payroll) => {
            if (!searchQuery.trim()) return true;
            const query = searchQuery.toLowerCase();
            const name = p.employee?.name?.toLowerCase() || "";
            const code = p.employee?.adaa_emp_code?.toLowerCase() || "";
            return name.includes(query) || code.includes(query);
          });
          const totals = filtered.reduce(
            (acc: any, p: Payroll) => {
              acc.totalHours += Number(p.totalHours) || 0;
              acc.totalOtHours += Number(p.totalOtHours) || 0;
              acc.totalOffdaysWorkedHours += Number(p.totalOffdaysWorkedHours) || 0;
              acc.totalIdleDayHours += Number(p.totalIdleDayHours) || 0;
              acc.grossSalary += Number(p.totalGrossSalary) || 0;
              acc.netSalary += Number(p.netSalary) || 0;
              return acc;
            },
            { totalHours: 0, totalOtHours: 0, totalOffdaysWorkedHours: 0, totalIdleDayHours: 0, grossSalary: 0, netSalary: 0 }
          );
          return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 border-brand-500 dark:border-brand-400 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Grand Total ({filtered.length} employees)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">Total Hours</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{formatNumber(totals.totalHours)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">OT Hours</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{formatNumber(totals.totalOtHours)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">Off-Day Hours</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{formatNumber(totals.totalOffdaysWorkedHours)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">Idle Hours</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{formatNumber(totals.totalIdleDayHours)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">Gross Salary</div>
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">AED {formatNumber(totals.grossSalary)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">Net Salary</div>
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">AED {formatNumber(totals.netSalary)}</div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Payroll List */}
        {!isLoading && payrollData && payrollData.length > 0 && (
          <>
            {/* Table View */}
            {viewMode === "table" && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
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
                          Basic Salary
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          HRA
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Other Allow
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Fixed Monthly
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
                      {payrollData
                        .filter((payroll: Payroll) => {
                          if (!searchQuery.trim()) return true;
                          const query = searchQuery.toLowerCase();
                          const employeeName =
                            payroll.employee?.name?.toLowerCase() || "";
                          const employeeCode =
                            payroll.employee?.adaa_emp_code?.toLowerCase() ||
                            "";
                          return (
                            employeeName.includes(query) ||
                            employeeCode.includes(query)
                          );
                        })
                        .map((payroll: Payroll) => {
                          const employee = payroll.employee;
                          const employeeSalaryTotal =
                            (Number(employee?.basic_salary) || 0) +
                            (Number(employee?.hra) || 0) +
                            (Number(employee?.other_allowance) || 0);

                          return (
                            <tr
                              key={payroll.id}
                              className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                            >
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
                                  {formatNumber(payroll.totalHours)}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right">
                                <div className="text-sm text-gray-900 dark:text-white">
                                  {formatNumber(payroll.totalOtHours)}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right">
                                <div className="text-sm text-gray-900 dark:text-white">
                                  {formatNumber(
                                    payroll.totalOffdaysWorkedHours
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right">
                                <div className="text-sm text-gray-900 dark:text-white">
                                  {formatNumber(payroll.totalIdleDayHours)}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right">
                                <div className="text-sm text-gray-900 dark:text-white">
                                  {formatNumber(
                                    Number(employee?.basic_salary) || 0
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right">
                                <div className="text-sm text-gray-900 dark:text-white">
                                  {formatNumber(Number(employee?.hra) || 0)}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right">
                                <div className="text-sm text-gray-900 dark:text-white">
                                  {formatNumber(
                                    Number(employee?.other_allowance) || 0
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right">
                                <div className="text-sm font-medium text-purple-600 dark:text-purple-400">
                                  {formatNumber(employeeSalaryTotal)}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right">
                                <div className="text-sm text-gray-900 dark:text-white">
                                  {formatNumber(payroll.baseHourlyRate || 0)}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right">
                                <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                  {formatNumber(payroll.totalGrossSalary || 0)}
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
                                  {formatNumber(payroll.absentDaysDeductible)}
                                </div>
                              </td>
                              <td className="px-4 py-3 max-w-xs">
                                <div
                                  className="text-sm text-gray-900 dark:text-white truncate"
                                  title={formatJsonDisplay(
                                    payroll.otherDeductions
                                  )}
                                >
                                  {formatJsonDisplay(payroll.otherDeductions)}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right">
                                <div className="text-sm font-bold text-green-600 dark:text-green-400">
                                  {formatNumber(payroll.netSalary || 0)}
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
                                    onClick={() =>
                                      toggleEmployee(payroll.employeeId)
                                    }
                                    className="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
                                    title="View Details"
                                  >
                                    {expandedEmployees.has(
                                      payroll.employeeId
                                    ) ? (
                                      <ChevronUpIcon className="w-5 h-5" />
                                    ) : (
                                      <ChevronDownIcon className="w-5 h-5" />
                                    )}
                                  </button>
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
                                          "Edit functionality - calculations will be implemented as per your requirements"
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
                        const filtered = payrollData.filter((p: Payroll) => {
                          if (!searchQuery.trim()) return true;
                          const query = searchQuery.toLowerCase();
                          const name = p.employee?.name?.toLowerCase() || "";
                          const code = p.employee?.adaa_emp_code?.toLowerCase() || "";
                          return name.includes(query) || code.includes(query);
                        });
                        const totals = filtered.reduce(
                          (acc: any, p: Payroll) => {
                            acc.totalHours += Number(p.totalHours) || 0;
                            acc.totalOtHours += Number(p.totalOtHours) || 0;
                            acc.totalOffdaysWorkedHours += Number(p.totalOffdaysWorkedHours) || 0;
                            acc.totalIdleDayHours += Number(p.totalIdleDayHours) || 0;
                            acc.grossSalary += Number(p.totalGrossSalary) || 0;
                            acc.absentDeduct += Number(p.absentDaysDeductible) || 0;
                            acc.netSalary += Number(p.netSalary) || 0;
                            return acc;
                          },
                          { totalHours: 0, totalOtHours: 0, totalOffdaysWorkedHours: 0, totalIdleDayHours: 0, grossSalary: 0, absentDeduct: 0, netSalary: 0 }
                        );
                        return (
                          <tr className="bg-gray-100 dark:bg-gray-900 font-bold border-t-2 border-gray-300 dark:border-gray-600">
                            <td className="px-4 py-3 whitespace-nowrap sticky left-0 bg-gray-100 dark:bg-gray-900 z-10 text-sm font-bold text-gray-900 dark:text-white">
                              Grand Total
                            </td>
                            <td className="px-4 py-3"></td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-bold text-gray-900 dark:text-white">
                              {formatNumber(totals.totalHours)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-bold text-gray-900 dark:text-white">
                              {formatNumber(totals.totalOtHours)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-bold text-gray-900 dark:text-white">
                              {formatNumber(totals.totalOffdaysWorkedHours)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-bold text-gray-900 dark:text-white">
                              {formatNumber(totals.totalIdleDayHours)}
                            </td>
                            <td className="px-4 py-3" colSpan={4}></td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-bold text-blue-600 dark:text-blue-400">
                              {formatNumber(totals.grossSalary)}
                            </td>
                            <td className="px-4 py-3"></td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-bold text-red-600 dark:text-red-400">
                              {formatNumber(totals.absentDeduct)}
                            </td>
                            <td className="px-4 py-3"></td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-bold text-green-600 dark:text-green-400">
                              {formatNumber(totals.netSalary)}
                            </td>
                            <td className="px-4 py-3"></td>
                            <td className="px-4 py-3 sticky right-0 bg-gray-100 dark:bg-gray-900 z-10"></td>
                          </tr>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>

                {/* Expanded Details in Table View */}
                {payrollData
                  .filter((payroll: Payroll) =>
                    expandedEmployees.has(payroll.employeeId)
                  )
                  .map((payroll: Payroll) => (
                    <div
                      key={`details-${payroll.id}`}
                      className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900/30"
                    >
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {payroll.employee?.name || "Unknown Employee"}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          ID: {payroll.employee?.adaa_emp_code || "N/A"}
                        </p>
                      </div>
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
                                    Gross salary + allowances + deductions
                                  </p>
                                </div>
                                <div className="text-3xl font-bold text-green-700 dark:text-green-400">
                                  AED {formatNumber(payroll.netSalary)}
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
                                            {item.rateMultiplier !== 1 && (
                                              <span className="ml-2 text-xs text-gray-500">
                                                (
                                                {(
                                                  item.rateMultiplier * 100
                                                ).toFixed(0)}
                                                %)
                                              </span>
                                            )}
                                          </td>
                                          <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                                            {formatNumber(item.hours)}
                                          </td>
                                          <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                                            AED {formatNumber(item.hourlyRate)}
                                          </td>
                                          <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                                            AED {formatNumber(item.amount)}
                                          </td>
                                        </tr>
                                      )
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* Special Days */}
                          {payroll.hoursBreakdown.specialDays.length > 0 && (
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
                                            <span className="ml-2 text-xs text-gray-500">
                                              (
                                              {(
                                                item.rateMultiplier * 100
                                              ).toFixed(0)}
                                              %)
                                            </span>
                                          </td>
                                          <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                                            {formatNumber(item.hours)}
                                          </td>
                                          <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                                            AED {formatNumber(item.hourlyRate)}
                                          </td>
                                          <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                                            AED {formatNumber(item.amount)}
                                          </td>
                                        </tr>
                                      )
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
                                              item.date
                                            ).toLocaleDateString()}
                                            <span className="ml-2 text-xs text-gray-500">
                                              (
                                              {(
                                                item.rateMultiplier * 100
                                              ).toFixed(0)}
                                              %)
                                            </span>
                                          </td>
                                          <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                                            {formatNumber(item.hours)}
                                          </td>
                                          <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                                            AED {formatNumber(item.hourlyRate)}
                                          </td>
                                          <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                                            AED {formatNumber(item.amount)}
                                          </td>
                                        </tr>
                                      )
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
                                              item.date
                                            ).toLocaleDateString()}
                                            <span className="ml-2 text-xs text-gray-500">
                                              (
                                              {(
                                                item.rateMultiplier * 100
                                              ).toFixed(0)}
                                              %)
                                            </span>
                                          </td>
                                          <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                                            {formatNumber(item.hours)}
                                          </td>
                                          <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                                            AED {formatNumber(item.hourlyRate)}
                                          </td>
                                          <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                                            AED {formatNumber(item.amount)}
                                          </td>
                                        </tr>
                                      )
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
                                {formatNumber(payroll.totalHours)}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">
                                OT Hours:
                              </span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {formatNumber(payroll.totalOtHours)}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">
                                Off-days Hours:
                              </span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {formatNumber(payroll.totalOffdaysWorkedHours)}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">
                                Idle Hours:
                              </span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {formatNumber(payroll.totalIdleDayHours)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Fixed Salary Breakdown - THIRD */}
                      {payroll.employee && (
                        <div className="my-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                          <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100 mb-3 uppercase tracking-wider">
                            Fixed Salary Breakdown
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-purple-700 dark:text-purple-300">
                                Basic Salary:
                              </span>
                              <p className="font-medium text-purple-900 dark:text-purple-100 mt-1">
                                AED{" "}
                                {payroll.employee.basic_salary
                                  ? formatNumber(payroll.employee.basic_salary)
                                  : "0.00"}
                              </p>
                            </div>
                            <div>
                              <span className="text-purple-700 dark:text-purple-300">
                                HRA:
                              </span>
                              <p className="font-medium text-purple-900 dark:text-purple-100 mt-1">
                                AED{" "}
                                {payroll.employee.hra
                                  ? formatNumber(payroll.employee.hra)
                                  : "0.00"}
                              </p>
                            </div>
                            <div>
                              <span className="text-purple-700 dark:text-purple-300">
                                Other Allowance:
                              </span>
                              <p className="font-medium text-purple-900 dark:text-purple-100 mt-1">
                                AED{" "}
                                {payroll.employee.other_allowance
                                  ? formatNumber(
                                      payroll.employee.other_allowance
                                    )
                                  : "0.00"}
                              </p>
                            </div>
                            <div className="border-l-2 border-purple-300 dark:border-purple-600 pl-4">
                              <span className="text-purple-700 dark:text-purple-300 font-semibold">
                                Monthly Total:
                              </span>
                              <p className="font-bold text-purple-900 dark:text-purple-100 mt-1">
                                AED{" "}
                                {formatNumber(
                                  (Number(payroll.employee.basic_salary) || 0) +
                                    (Number(payroll.employee.hra) || 0) +
                                    (Number(payroll.employee.other_allowance) ||
                                      0)
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Additions/Deductions - FOURTH */}
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
                                  {formatNumber(payroll.absentDaysDeductible)}
                                </span>
                              </div>
                              <div>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  Other Deductions:
                                </span>
                                <p className="text-sm text-gray-900 dark:text-white mt-1">
                                  {formatJsonDisplay(payroll.otherDeductions)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Total Gross Salary - FIFTH */}
                      <div className="mb-6">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-500 dark:border-blue-600">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 uppercase tracking-wider">
                                Total Gross Salary
                              </h3>
                              <p className="text-sm text-blue-700 dark:text-blue-300">
                                Base Rate: AED{" "}
                                {formatNumber(payroll.baseHourlyRate || 0)}
                                /hr
                              </p>
                            </div>
                            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                              AED {formatNumber(payroll.totalGrossSalary || 0)}
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
                    </div>
                  ))}
              </div>
            )}

            {/* Card View */}
            {viewMode === "card" && (
              <div className="space-y-4">
                {payrollData
                  .filter((payroll: Payroll) => {
                    if (!searchQuery.trim()) return true;
                    const query = searchQuery.toLowerCase();
                    const employeeName =
                      payroll.employee?.name?.toLowerCase() || "";
                    const employeeCode =
                      payroll.employee?.adaa_emp_code?.toLowerCase() || "";
                    return (
                      employeeName.includes(query) ||
                      employeeCode.includes(query)
                    );
                  })
                  .map((payroll: Payroll) => {
                    const isExpanded = expandedEmployees.has(
                      payroll.employeeId
                    );

                    return (
                      <div
                        key={payroll.id}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
                      >
                        {/* Employee Header */}
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
                                Total Hours: {formatNumber(payroll.totalHours)}
                              </div>
                            </div>
                          </div>
                        </button>

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
                                          Gross salary + allowances + deductions
                                        </p>
                                      </div>
                                      <div className="text-3xl font-bold text-green-700 dark:text-green-400">
                                        AED {formatNumber(payroll.netSalary)}
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
                                                  {item.rateMultiplier !==
                                                    1 && (
                                                    <span className="ml-2 text-xs text-gray-500">
                                                      (
                                                      {(
                                                        item.rateMultiplier *
                                                        100
                                                      ).toFixed(0)}
                                                      %)
                                                    </span>
                                                  )}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                                                  {formatNumber(item.hours)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                                                  AED{" "}
                                                  {formatNumber(
                                                    item.hourlyRate
                                                  )}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                                                  AED{" "}
                                                  {formatNumber(item.amount)}
                                                </td>
                                              </tr>
                                            )
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
                                                  <span className="ml-2 text-xs text-gray-500">
                                                    (
                                                    {(
                                                      item.rateMultiplier * 100
                                                    ).toFixed(0)}
                                                    %)
                                                  </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                                                  {formatNumber(item.hours)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                                                  AED{" "}
                                                  {formatNumber(
                                                    item.hourlyRate
                                                  )}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                                                  AED{" "}
                                                  {formatNumber(item.amount)}
                                                </td>
                                              </tr>
                                            )
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
                                                    item.date
                                                  ).toLocaleDateString()}
                                                  <span className="ml-2 text-xs text-gray-500">
                                                    (
                                                    {(
                                                      item.rateMultiplier * 100
                                                    ).toFixed(0)}
                                                    %)
                                                  </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                                                  {formatNumber(item.hours)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                                                  AED{" "}
                                                  {formatNumber(
                                                    item.hourlyRate
                                                  )}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                                                  AED{" "}
                                                  {formatNumber(item.amount)}
                                                </td>
                                              </tr>
                                            )
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
                                                    item.date
                                                  ).toLocaleDateString()}
                                                  <span className="ml-2 text-xs text-gray-500">
                                                    (
                                                    {(
                                                      item.rateMultiplier * 100
                                                    ).toFixed(0)}
                                                    %)
                                                  </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                                                  {formatNumber(item.hours)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                                                  AED{" "}
                                                  {formatNumber(
                                                    item.hourlyRate
                                                  )}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                                                  AED{" "}
                                                  {formatNumber(item.amount)}
                                                </td>
                                              </tr>
                                            )
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
                                      {formatNumber(payroll.totalHours)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">
                                      OT Hours:
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                      {formatNumber(payroll.totalOtHours)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">
                                      Off-days Hours:
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                      {formatNumber(
                                        payroll.totalOffdaysWorkedHours
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">
                                      Idle Hours:
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                      {formatNumber(payroll.totalIdleDayHours)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Fixed Salary Breakdown - THIRD */}
                            {payroll.employee && (
                              <div className="my-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                                <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100 mb-3 uppercase tracking-wider">
                                  Fixed Salary Breakdown
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <span className="text-purple-700 dark:text-purple-300">
                                      Basic Salary:
                                    </span>
                                    <p className="font-medium text-purple-900 dark:text-purple-100 mt-1">
                                      AED{" "}
                                      {payroll.employee.basic_salary
                                        ? formatNumber(
                                            payroll.employee.basic_salary
                                          )
                                        : "0.00"}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-purple-700 dark:text-purple-300">
                                      HRA:
                                    </span>
                                    <p className="font-medium text-purple-900 dark:text-purple-100 mt-1">
                                      AED{" "}
                                      {payroll.employee.hra
                                        ? formatNumber(payroll.employee.hra)
                                        : "0.00"}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-purple-700 dark:text-purple-300">
                                      Other Allowance:
                                    </span>
                                    <p className="font-medium text-purple-900 dark:text-purple-100 mt-1">
                                      AED{" "}
                                      {payroll.employee.other_allowance
                                        ? formatNumber(
                                            payroll.employee.other_allowance
                                          )
                                        : "0.00"}
                                    </p>
                                  </div>
                                  <div className="border-l-2 border-purple-300 dark:border-purple-600 pl-4">
                                    <span className="text-purple-700 dark:text-purple-300 font-semibold">
                                      Monthly Total:
                                    </span>
                                    <p className="font-bold text-purple-900 dark:text-purple-100 mt-1">
                                      AED{" "}
                                      {formatNumber(
                                        (Number(
                                          payroll.employee.basic_salary
                                        ) || 0) +
                                          (Number(payroll.employee.hra) || 0) +
                                          (Number(
                                            payroll.employee.other_allowance
                                          ) || 0)
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Additions/Deductions - FOURTH */}
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
                                        {formatNumber(
                                          payroll.absentDaysDeductible
                                        )}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        Other Deductions:
                                      </span>
                                      <p className="text-sm text-gray-900 dark:text-white mt-1">
                                        {formatJsonDisplay(
                                          payroll.otherDeductions
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Total Gross Salary - FIFTH */}
                            <div className="mb-6">
                              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-500 dark:border-blue-600">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 uppercase tracking-wider">
                                      Total Gross Salary
                                    </h3>
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                      Base Rate: AED{" "}
                                      {formatNumber(
                                        payroll.baseHourlyRate || 0
                                      )}
                                      /hr
                                    </p>
                                  </div>
                                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                                    AED{" "}
                                    {formatNumber(
                                      payroll.totalGrossSalary || 0
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
                                      "Edit functionality - calculations will be implemented as per your requirements"
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
