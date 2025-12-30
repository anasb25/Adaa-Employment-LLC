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
import {
  ChevronDownIcon,
  ChevronUpIcon,
  PencilIcon,
  TrashBinIcon,
  BoltIcon,
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

              <div className="text-sm text-gray-600 dark:text-gray-400">
                {payrollData?.length || 0} employee(s) found
              </div>
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
            {payrollData.map((payroll: Payroll) => {
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
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          OT: {formatNumber(payroll.totalOtHours)} hrs
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Employee Details */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900/30">
                      {/* Salary Summary */}
                      {payroll.hoursBreakdown && (
                        <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Total Gross Salary
                              </h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Base Rate: AED{" "}
                                {formatNumber(payroll.baseHourlyRate || 0)}/hr
                              </p>
                            </div>
                            <div className="text-2xl font-bold text-brand-600 dark:text-brand-400">
                              AED {formatNumber(payroll.totalGrossSalary || 0)}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Detailed Hours Breakdown */}
                      {payroll.hoursBreakdown ? (
                        <div className="space-y-6">
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
                                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                            {new Date(
                                              item.date
                                            ).toLocaleDateString()}
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
                          {payroll.hoursBreakdown.idle.hours > 0 && (
                            <div className="space-y-3">
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                                Idle Hours
                              </h4>
                              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                      {formatNumber(
                                        payroll.hoursBreakdown.idle.hours
                                      )}{" "}
                                      hours @ AED{" "}
                                      {formatNumber(
                                        payroll.hoursBreakdown.idle.hourlyRate
                                      )}
                                      /hr
                                    </span>
                                  </div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    AED{" "}
                                    {formatNumber(
                                      payroll.hoursBreakdown.idle.amount
                                    )}
                                  </div>
                                </div>
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
                            <div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                Arrears:
                              </span>
                              <p className="text-sm text-gray-900 dark:text-white mt-1">
                                {formatJsonDisplay(payroll.arrears)}
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
    </PermissionGuard>
  );
}
