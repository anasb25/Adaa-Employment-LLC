export function getCurrentMonth(): string {
  const now = new Date();
  return formatMonthValue(now.getFullYear(), now.getMonth() + 1);
}

export function formatMonthValue(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function parseMonthValue(value: string): { year: number; month: number } {
  const [yearPart, monthPart] = value.split("-");
  return {
    year: Number(yearPart) || new Date().getFullYear(),
    month: Number(monthPart) || 1,
  };
}

export function formatMonthLabel(value: string): string {
  const { year, month } = parseMonthValue(value);
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export const MONTH_SHORT_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;
