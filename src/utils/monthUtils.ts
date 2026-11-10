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

export function padDatePart(value: number): string {
  return String(value).padStart(2, "0");
}

export function lastDateOfMonth(year: number, month: number): string {
  const day = new Date(year, month, 0).getDate();
  return `${year}-${padDatePart(month)}-${padDatePart(day)}`;
}

export function monthStartDate(year: number, month: number): string {
  return `${year}-${padDatePart(month)}-01`;
}

export function clampDateToMonth(
  date: string,
  year: number,
  month: number,
  today = formatDateValue(new Date()),
): string {
  const day = Number(date?.split("-")[2]) || 1;
  const lastDay = Number(lastDateOfMonth(year, month).slice(-2));
  const candidate = `${year}-${padDatePart(month)}-${padDatePart(Math.min(day, lastDay))}`;
  const cap = lastDateOfMonth(year, month) > today ? today : lastDateOfMonth(year, month);
  return candidate > cap ? cap : candidate;
}

export function formatDateValue(date: Date): string {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
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
