import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
          .net-box { background: #fff3e0; padding: 15px; margin: 10px 0; border-radius: 5px; font-size: 18px; font-weight: bold; }
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
          <div class="gross-box">
            <strong>Gross Salary from Hours:</strong> AED ${formatNumber(
              payroll.totalGrossSalary || 0
            )}
          </div>
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

        <div class="net-box">
          NET SALARY: AED ${formatNumber(payroll.netSalary || 0)}
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
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-4">
            <Input
              type="text"
              placeholder="Search by Employee Name or ADAA Code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-96"
            />
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

        {/* Payroll List */}
        {!isLoading && payrollData && payrollData.length > 0 && (
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
                  employeeName.includes(query) || employeeCode.includes(query)
                );
              })
              .map((payroll: Payroll) => {
                const isExpanded = expandedEmployees.has(payroll.employeeId);

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
                        {/* Salary Summary */}
                        {payroll.hoursBreakdown && (
                          <div className="mb-6 space-y-4">
                            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                              <div className="flex justify-between items-center">
                                <div>
                                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Total Gross Salary
                                  </h4>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Base Rate: AED{" "}
                                    {formatNumber(payroll.baseHourlyRate || 0)}
                                    /hr
                                  </p>
                                </div>
                                <div className="text-2xl font-bold text-brand-600 dark:text-brand-400">
                                  AED{" "}
                                  {formatNumber(payroll.totalGrossSalary || 0)}
                                </div>
                              </div>
                            </div>

                            {payroll.netSalary !== null &&
                              payroll.netSalary !== undefined && (
                                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-500 dark:border-green-600">
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <h4 className="text-lg font-semibold text-green-900 dark:text-green-100">
                                        Net Salary
                                      </h4>
                                      <p className="text-sm text-green-700 dark:text-green-300">
                                        After allowances and deductions
                                      </p>
                                    </div>
                                    <div className="text-3xl font-bold text-green-700 dark:text-green-400">
                                      AED {formatNumber(payroll.netSalary)}
                                    </div>
                                  </div>
                                </div>
                              )}
                          </div>
                        )}

                        {/* Detailed Hours Breakdown */}
                        {payroll.hoursBreakdown ? (
                          <div className="space-y-6">
                            {/* Employee Salary Information */}
                            {payroll.employee && (
                              <div className="my-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                                <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-3">
                                  Employee Fixed Salary
                                </h4>
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
                                              AED{" "}
                                              {formatNumber(item.hourlyRate)}
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
                                              AED{" "}
                                              {formatNumber(item.hourlyRate)}
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
                                              AED{" "}
                                              {formatNumber(item.hourlyRate)}
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
                                              AED{" "}
                                              {formatNumber(item.hourlyRate)}
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
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                              Hours Summary (Legacy)
                            </h4>
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
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
