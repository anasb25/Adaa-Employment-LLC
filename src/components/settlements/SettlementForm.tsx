import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { settlementsApi } from "../../services/api/settlementsApi";
import { employeesApi } from "../../services/api/employeesApi";
import { payrollApi } from "../../services/api/payrollApi";
import { QUERY_KEYS } from "../../lib/constants";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import {
  Settlement,
  CreateSettlementRequest,
  ContractType,
  SettlementStatus,
  DeductionItem,
} from "../../types/settlement";
import { PlusIcon, TrashBinIcon } from "../../icons";

interface SettlementFormProps {
  settlement?: Settlement;
  onClose: () => void;
}

export default function SettlementForm({
  settlement,
  onClose,
}: SettlementFormProps) {
  const queryClient = useQueryClient();
  const isEditMode = !!settlement;

  // Form state - simplified
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number>(
    settlement?.employeeId || 0
  );
  const [lastDateOfWork, setLastDateOfWork] = useState<string>(
    settlement?.lastDateOfWork || ""
  );
  // Gratuity is always eligible, no checkbox needed
  const eligibleForGratuity = true;
  const [deductionItems, setDeductionItems] = useState<DeductionItem[]>(
    settlement?.deductionItems || []
  );
  const [lastMonthSalaryPaid, setLastMonthSalaryPaid] = useState<boolean>(
    settlement?.lastMonthSalaryPaid ?? false
  );
  const [status, setStatus] = useState<SettlementStatus>(
    settlement?.status || SettlementStatus.DRAFT
  );
  const [manualSalaryEntry, setManualSalaryEntry] = useState(false);
  const [manualLastMonthSalary, setManualLastMonthSalary] = useState<number>(0);
  const [manualCurrentMonthSalary, setManualCurrentMonthSalary] = useState<number>(0);
  const [manualCurrentMonthHours, setManualCurrentMonthHours] = useState<number>(0);
  const [manualAbsentDays, setManualAbsentDays] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);

  // Fetch employees for selection with search
  const { data: employeesData } = useQuery({
    queryKey: [...QUERY_KEYS.employees.all, 1, 100],
    queryFn: () => employeesApi.getEmployees(1, 100),
  });

  // Search employees
  const { data: searchEmployeesData } = useQuery({
    queryKey: [...QUERY_KEYS.employees.search, employeeSearchQuery, 1, 50],
    queryFn: () => employeesApi.searchEmployees(employeeSearchQuery, 1, 50),
    enabled: employeeSearchQuery.length > 0,
  });

  // Get employees list (search results or all)
  const availableEmployees = employeeSearchQuery.length > 0
    ? searchEmployeesData?.data || []
    : employeesData?.data || [];

  // Fetch employee details when selected (with skills for job title)
  const { data: selectedEmployee } = useQuery({
    queryKey: [...QUERY_KEYS.employees.detail(selectedEmployeeId)],
    queryFn: () => employeesApi.getEmployee(selectedEmployeeId),
    enabled: selectedEmployeeId > 0,
  });

  // Get job title from first skill
  const getJobTitle = () => {
    if (!selectedEmployee?.employeeSkills || selectedEmployee.employeeSkills.length === 0) {
      return "";
    }
    return selectedEmployee.employeeSkills[0]?.skill?.skill || "";
  };

  // Get current month and last month in YYYY-MM format
  const getCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const getLastMonth = () => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const year = lastMonth.getFullYear();
    const month = String(lastMonth.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const currentMonth = getCurrentMonth();
  const lastMonth = getLastMonth();

  // Check payroll existence for current and last month (only when creating new settlement)
  const { data: currentMonthPayroll, isLoading: isLoadingCurrentMonth } = useQuery({
    queryKey: ['payroll-check', selectedEmployeeId, currentMonth],
    queryFn: () => payrollApi.checkPayrollExists(selectedEmployeeId, currentMonth),
    enabled: selectedEmployeeId > 0 && !isEditMode,
  });

  const { data: lastMonthPayroll, isLoading: isLoadingLastMonth } = useQuery({
    queryKey: ['payroll-check', selectedEmployeeId, lastMonth],
    queryFn: () => payrollApi.checkPayrollExists(selectedEmployeeId, lastMonth),
    enabled: selectedEmployeeId > 0 && !isEditMode,
  });

  const isLoadingPayrolls = isLoadingCurrentMonth || isLoadingLastMonth;

  // Check if both payrolls exist (only when data is loaded and not in edit mode)
  const payrollsExist = 
    isEditMode ||
    manualSalaryEntry ||
    (!isLoadingPayrolls &&
    currentMonthPayroll?.exists === true && 
    lastMonthPayroll?.exists === true);
  
  const missingPayrolls: string[] = [];
  if (selectedEmployeeId > 0 && !isLoadingPayrolls && !manualSalaryEntry) {
    if (!currentMonthPayroll?.exists) {
      missingPayrolls.push(`Current month (${currentMonth})`);
    }
    if (!lastMonthPayroll?.exists) {
      missingPayrolls.push(`Last month (${lastMonth})`);
    }
  }

  // Calculate gratuity when employee or last date changes
  const { data: gratuityCalc, refetch: recalculateGratuity } = useQuery({
    queryKey: [
      "gratuity-calc",
      selectedEmployeeId,
      lastDateOfWork,
      eligibleForGratuity,
    ],
    queryFn: () =>
      settlementsApi.calculateGratuity(selectedEmployeeId, lastDateOfWork),
    enabled: selectedEmployeeId > 0 && lastDateOfWork !== "" && eligibleForGratuity,
  });

  // Auto-calculate payment items from employee data and gratuity
  const generatePaymentItems = () => {
    // In edit mode, use existing payment items if available
    if (isEditMode && settlement?.paymentItems && settlement.paymentItems.length > 0) {
      return settlement.paymentItems;
    }
    
    if (!selectedEmployee) return [];

    const items = [];
    const basicSalary = Number(selectedEmployee.basic_salary) || 0;
    const hra = Number(selectedEmployee.hra) || 0;
    const annualLeaveBalance = Number(selectedEmployee.annual_leave_balance) || 0;

    // 1. GRATUITY - Formula: basic salary / 30 * gratuity days per year (21 or 30) * total days from date of joining till last day / 365
    if (eligibleForGratuity && gratuityCalc && gratuityCalc.gratuityAmount > 0) {
      const totalDays = selectedEmployee.date_of_joining && lastDateOfWork
        ? Math.floor((new Date(lastDateOfWork).getTime() - new Date(selectedEmployee.date_of_joining).getTime()) / (24 * 60 * 60 * 1000))
        : 0;
      items.push({
        description: "GRATUITY",
        forDays: totalDays, // Store total days for display
        amount: Number(gratuityCalc.gratuityAmount) || 0,
      });
    }

    // 2. LEAVE SALARY - Formula: ((basic salary + HRA)/30) * leave balance days
    if (annualLeaveBalance > 0) {
      const leaveSalaryAmount = ((basicSalary + hra) / 30) * annualLeaveBalance;
      items.push({
        description: "LEAVE SALARY",
        forDays: annualLeaveBalance,
        amount: leaveSalaryAmount,
      });
    }

    // 3. Last Month Salary - Show "PAID" or net salary amount
    const lastMonthName = new Date(`${lastMonth}-01`).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
    const lastMonthNetSalary = manualSalaryEntry
      ? manualLastMonthSalary
      : (lastMonthPayroll?.payroll ? Number(lastMonthPayroll.payroll.netSalary) || 0 : 0);
    items.push({
      description: `${lastMonthName} SALARY`,
      amount: lastMonthSalaryPaid ? 0 : lastMonthNetSalary,
    });

    // 4. Current Month Salary - Net salary from current month payroll or manual entry
    const currentMonthName = new Date(`${currentMonth}-01`).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
    const currentMonthNetSalary = manualSalaryEntry
      ? manualCurrentMonthSalary
      : (currentMonthPayroll?.payroll ? Number(currentMonthPayroll.payroll.netSalary) || 0 : 0);
    const lastDate = lastDateOfWork ? new Date(lastDateOfWork) : new Date();
    const monthStart = new Date(lastDate.getFullYear(), lastDate.getMonth(), 1);
    const fromDate = monthStart.toISOString().split('T')[0];
    const toDate = lastDateOfWork || lastDate.toISOString().split('T')[0];
    
    const totalHours = manualSalaryEntry
      ? manualCurrentMonthHours
      : (currentMonthPayroll?.payroll ? Number(currentMonthPayroll.payroll.totalHours) || 0 : 0);
    
    items.push({
      description: `${currentMonthName} SALARY`,
      fromDate,
      toDate,
      forDays: totalHours,
      amount: currentMonthNetSalary,
    });

    // 5. EARLY TERMINATION COMPENSATION - Always 0
    items.push({
      description: "EARLY TERMINATION COMPENSATION",
      amount: 0,
    });

    // Note: AIR TICKET is displayed separately, not in payment items total
    return items;
  };

  // Calculate totals
  const calculateTotals = () => {
    const paymentItems = generatePaymentItems();
    const totalDue = paymentItems.reduce((sum, item) => sum + Number(item.amount), 0);
    const totalDeduction = deductionItems.reduce(
      (sum, item) => sum + Number(item.amount),
      0
    );
    return {
      totalDue,
      totalDeduction,
      finalAmount: totalDue - totalDeduction,
      paymentItems,
    };
  };

  const totals = calculateTotals();

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: async () => {
      if (!selectedEmployeeId || selectedEmployeeId === 0) {
        throw new Error("Please select an employee");
      }
      if (!selectedEmployee) {
        throw new Error("Please select a valid employee");
      }
      if (!lastDateOfWork) {
        throw new Error("Please enter last date of work");
      }

      // Check if payrolls exist (only when creating new, not manual entry)
      if (!isEditMode && !manualSalaryEntry && !payrollsExist) {
        throw new Error(
          `Payroll entries are missing for: ${missingPayrolls.join(', ')}. Please create payroll first or enable manual salary entry.`
        );
      }

      const basicSalary = Number(selectedEmployee.basic_salary) || 0;
      const hra = Number(selectedEmployee.hra) || 0;
      const otherAllowance = Number(selectedEmployee.other_allowance) || 0;
      const totalSalary = basicSalary + hra + otherAllowance;

      const absentDays = manualSalaryEntry
        ? manualAbsentDays
        : (currentMonthPayroll?.payroll?.absentDaysDeductible 
            ? Number(currentMonthPayroll.payroll.absentDaysDeductible) 
            : 0);

      const settlementData: CreateSettlementRequest = {
        employeeId: selectedEmployee.id,
        empCode: selectedEmployee.adaa_emp_code,
        empName: selectedEmployee.name,
        jobTitle: getJobTitle(),
        dateOfJoin: selectedEmployee.date_of_joining || undefined,
        lastDateOfWork,
        lastTotalSalary: totalSalary,
        totalDaysAbsent: absentDays,
        lastMonthSalaryPaid,
        eligibleForGratuity,
        gratuityDaysPerYear: gratuityCalc?.totalYearsOfService
          ? (gratuityCalc.totalYearsOfService < 5 ? 21 : 30)
          : 21,
        hourlySalary: basicSalary,
        hourlyRate: Number(gratuityCalc?.hourlyRate) || 0,
        allowance: hra,
        otherAllowances: otherAllowance,
        totalYearsOfService: Number(gratuityCalc?.totalYearsOfService) || 0,
        annualLeaveBalance: Number(selectedEmployee.annual_leave_balance) || 0,
        contractType: ContractType.LIMITED, // Default, can be added to employee entity
        paymentItems: totals.paymentItems,
        deductionItems,
        passportNo: selectedEmployee.pp_no || undefined,
        status,
      };

      if (isEditMode && settlement) {
        return settlementsApi.updateSettlement(settlement.id, settlementData);
      }
      return settlementsApi.createSettlement(settlementData);
    },
    onSuccess: () => {
      toast.success(
        `Settlement ${isEditMode ? "updated" : "created"} successfully!`
      );
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.settlements.all,
      });
      onClose();
    },
    onError: (error: any) => {
      toast.error(
        error.message ||
          error.response?.data?.message ||
          `Failed to ${isEditMode ? "update" : "create"} settlement`
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  // Deduction Items Management
  const addDeductionItem = () => {
    setDeductionItems([...deductionItems, { description: "", amount: 0 }]);
  };

  const updateDeductionItem = (
    index: number,
    field: keyof DeductionItem,
    value: any
  ) => {
    setDeductionItems(
      deductionItems.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const removeDeductionItem = (index: number) => {
    setDeductionItems(deductionItems.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Employee Selection */}
      {!isEditMode && (
        <div className="relative">
          <Label htmlFor="employeeSearch">Select Employee *</Label>
          <div className="relative">
            <Input
              id="employeeSearch"
              type="text"
              placeholder="Search by employee name or code..."
              value={employeeSearchQuery}
              onChange={(e) => {
                setEmployeeSearchQuery(e.target.value);
                setShowEmployeeDropdown(true);
              }}
              onFocus={() => setShowEmployeeDropdown(true)}
              required={selectedEmployeeId === 0}
              className="pr-10"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Dropdown Results */}
          {showEmployeeDropdown && availableEmployees.length > 0 && (
            <div className="absolute z-[100] w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {availableEmployees.map((emp) => (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => {
                    setSelectedEmployeeId(emp.id);
                    setEmployeeSearchQuery(`${emp.adaa_emp_code} - ${emp.name}`);
                    setShowEmployeeDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none"
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    {emp.adaa_emp_code}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {emp.name}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* No results message */}
          {showEmployeeDropdown &&
            employeeSearchQuery.length > 0 &&
            availableEmployees.length === 0 && (
              <div className="absolute z-[100] w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg p-4 text-center text-gray-500 dark:text-gray-400">
                No employees found
              </div>
            )}

          {/* Selected employee display */}
          {selectedEmployeeId > 0 && selectedEmployee && (
            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-sm">
                <span className="font-medium text-blue-900 dark:text-blue-200">
                  Selected: {selectedEmployee.adaa_emp_code} - {selectedEmployee.name}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedEmployeeId(0);
                    setEmployeeSearchQuery("");
                    setShowEmployeeDropdown(false);
                  }}
                  className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Payroll Validation Warning / Manual Entry Option */}
          {!isEditMode && selectedEmployeeId > 0 && !isLoadingPayrolls && missingPayrolls.length > 0 && !manualSalaryEntry && (
            <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 mr-2 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-1">
                    Payroll Entries Missing
                  </h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">
                    Missing for: <strong>{missingPayrolls.join(', ')}</strong>.
                    You can create the payroll first, or enter salary amounts manually.
                  </p>
                  <button
                    type="button"
                    onClick={() => setManualSalaryEntry(true)}
                    className="text-sm font-medium text-amber-800 dark:text-amber-200 underline hover:no-underline"
                  >
                    Enter salary amounts manually
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Manual Salary Entry Toggle (always visible once enabled, or when payrolls exist but user wants override) */}
          {!isEditMode && selectedEmployeeId > 0 && (
            <div className="mt-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={manualSalaryEntry}
                  onChange={(e) => setManualSalaryEntry(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Enter salary amounts manually (override payroll)
                </span>
              </label>
            </div>
          )}

          {/* Manual Salary Inputs */}
          {!isEditMode && manualSalaryEntry && selectedEmployeeId > 0 && (
            <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 space-y-3">
              <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                Manual Salary Entry
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                    Last Month Net Salary (AED)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={manualLastMonthSalary}
                    onChange={(e) => setManualLastMonthSalary(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-blue-300 dark:border-blue-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                    Current Month Net Salary (AED)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={manualCurrentMonthSalary}
                    onChange={(e) => setManualCurrentMonthSalary(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-blue-300 dark:border-blue-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                    Current Month Total Hours
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={manualCurrentMonthHours}
                    onChange={(e) => setManualCurrentMonthHours(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-blue-300 dark:border-blue-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                    Absent Days (Current Month)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={manualAbsentDays}
                    onChange={(e) => setManualAbsentDays(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-blue-300 dark:border-blue-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Click outside to close dropdown */}
          {showEmployeeDropdown && (
            <div
              className="fixed inset-0 z-[90]"
              onClick={() => setShowEmployeeDropdown(false)}
            />
          )}
        </div>
      )}

      {/* Employee Info Display */}
      {selectedEmployee && (
        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
            Employee Information
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Code:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {selectedEmployee.adaa_emp_code}
              </span>
            </div>
            {((!isLoadingPayrolls && currentMonthPayroll?.payroll) || manualSalaryEntry) && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">Total Days Absent (Current Month):</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {manualSalaryEntry
                    ? manualAbsentDays.toFixed(2)
                    : Number(currentMonthPayroll?.payroll?.absentDaysDeductible || 0).toFixed(2)}
                </span>
              </div>
            )}
            <div>
              <span className="text-gray-500 dark:text-gray-400">Name:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {selectedEmployee.name}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">
                Date of Joining:
              </span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {selectedEmployee.date_of_joining || "N/A"}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">
                Basic Salary:
              </span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                AED {selectedEmployee.basic_salary || 0}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Last Date of Work */}
      <div>
        <Label htmlFor="lastDateOfWork">Last Date of Work *</Label>
        <Input
          type="date"
          id="lastDateOfWork"
          value={lastDateOfWork}
          onChange={(e) => setLastDateOfWork(e.target.value)}
          required
        />
      </div>

      {/* Last Month Salary Paid */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="lastMonthSalaryPaid"
          checked={lastMonthSalaryPaid}
          onChange={(e) => setLastMonthSalaryPaid(e.target.checked)}
          className="w-4 h-4"
          disabled={!lastMonthPayroll?.payroll && !manualSalaryEntry}
        />
        <Label htmlFor="lastMonthSalaryPaid">
          Last Month Salary Already Paid
          {!lastMonthPayroll?.payroll && !manualSalaryEntry && (
            <span className="text-gray-500 text-xs ml-2">(Requires last month payroll or manual entry)</span>
          )}
        </Label>
      </div>


      {/* Payment Items Preview */}
      {selectedEmployee && totals.paymentItems.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-semibold mb-3 text-blue-800 dark:text-blue-300">
            Payment Items Preview
          </h3>
          <div className="space-y-2 text-sm">
            {totals.paymentItems.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-blue-700 dark:text-blue-400">
                  {item.description}
                  {item.description.includes("SALARY") && lastMonthSalaryPaid && item.amount === 0 && (
                    <span className="ml-2 bg-yellow-200 px-2 py-0.5 rounded text-xs">PAID</span>
                  )}
                </span>
                <span className="font-semibold text-blue-900 dark:text-blue-200">
                  {item.description.includes("SALARY") && lastMonthSalaryPaid && item.amount === 0 
                    ? "PAID" 
                    : `AED ${Number(item.amount).toFixed(2)}`}
                </span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-2 border-t border-blue-300 dark:border-blue-700 font-bold">
              <span className="text-blue-900 dark:text-blue-200">Total Due:</span>
              <span className="text-blue-900 dark:text-blue-200">
                AED {totals.totalDue.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Gratuity Calculation Display */}
      {eligibleForGratuity && gratuityCalc && (
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <h3 className="text-sm font-semibold mb-3 text-green-800 dark:text-green-300">
            Calculated Gratuity (UAE Federal Law)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-green-700 dark:text-green-400">
                Years of Service:
              </span>
              <p className="font-bold text-lg text-green-900 dark:text-green-200">
                {gratuityCalc.totalYearsOfService}
              </p>
            </div>
            <div>
              <span className="text-green-700 dark:text-green-400">
                Eligible Days:
              </span>
              <p className="font-bold text-lg text-green-900 dark:text-green-200">
                {gratuityCalc.eligibleDays}
              </p>
            </div>
            <div>
              <span className="text-green-700 dark:text-green-400">
                Hourly Rate:
              </span>
              <p className="font-bold text-lg text-green-900 dark:text-green-200">
                AED {Number(gratuityCalc.hourlyRate).toFixed(2)}
              </p>
            </div>
            <div>
              <span className="text-green-700 dark:text-green-400">
                Gratuity Amount:
              </span>
              <p className="font-bold text-lg text-green-900 dark:text-green-200">
                AED {Number(gratuityCalc.gratuityAmount).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Deduction Details */}
      <div className="border-t pt-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Deduction Details
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addDeductionItem}
            startIcon={<PlusIcon />}
          >
            Add Item
          </Button>
        </div>
        {deductionItems.length > 0 && (
          <div className="space-y-2">
            {deductionItems.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-7">
                  <Input
                    placeholder="Description (e.g., Advance Cash, Loan)"
                    value={item.description}
                    onChange={(e) =>
                      updateDeductionItem(index, "description", e.target.value)
                    }
                    required
                  />
                </div>
                <div className="col-span-4">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Amount (AED)"
                    value={item.amount}
                    onChange={(e) =>
                      updateDeductionItem(
                        index,
                        "amount",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    required
                  />
                </div>
                <div className="col-span-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeDeductionItem(index)}
                    className="text-red-600"
                  >
                    <TrashBinIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Final Settlement Summary */}
      <div className="border-t pt-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-blue-700 dark:text-blue-300">
              Total Due:
            </span>
            <span className="font-semibold text-blue-900 dark:text-blue-200">
              AED {totals.totalDue.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-blue-700 dark:text-blue-300">
              Total Deductions:
            </span>
            <span className="font-semibold text-blue-900 dark:text-blue-200">
              AED {totals.totalDeduction.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-blue-300 dark:border-blue-700">
            <span className="font-bold text-blue-900 dark:text-blue-100">
              FINAL AMOUNT:
            </span>
            <span className="font-bold text-xl text-blue-900 dark:text-blue-100">
              AED {totals.finalAmount.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Status */}
      <div>
        <Label htmlFor="status">Settlement Status</Label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as SettlementStatus)}
          className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
        >
          <option value={SettlementStatus.DRAFT}>Draft</option>
          <option value={SettlementStatus.PENDING_APPROVAL}>
            Pending Approval
          </option>
          <option value={SettlementStatus.APPROVED}>Approved</option>
          <option value={SettlementStatus.PAID}>Paid</option>
          <option value={SettlementStatus.CANCELLED}>Cancelled</option>
        </select>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={mutation.isPending || !payrollsExist}
          title={!payrollsExist ? "Please create payroll entries for current and last month first" : ""}
        >
          {mutation.isPending
            ? "Saving..."
            : isEditMode
            ? "Update Settlement"
            : "Create Settlement"}
        </Button>
      </div>
    </form>
  );
}

