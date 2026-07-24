import { Payroll } from "../types/payroll";

export const ADAA_SUPPLIER_NAME = "ADAA";

export function isAdaaPayrollEmployee(payroll: Payroll): boolean {
  const supplierName = payroll.employee?.supplier?.name;
  if (supplierName) {
    return supplierName === ADAA_SUPPLIER_NAME;
  }

  const code = (payroll.employee?.adaa_emp_code || "").toUpperCase();
  return code.startsWith("A") && !code.startsWith("JA");
}

export function filterAdaaPayrollRecords(payrolls: Payroll[] | undefined): Payroll[] {
  if (!payrolls) return [];
  return payrolls.filter(isAdaaPayrollEmployee);
}
