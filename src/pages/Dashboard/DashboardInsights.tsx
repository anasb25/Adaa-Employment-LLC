import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import DashboardTabs from "../../components/dashboard/DashboardTabs";
import StatCard from "../../components/dashboard/StatCard";
import InsightsBoard, {
  InsightsVariant,
} from "../../components/dashboard/insights/InsightsBoard";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import { dashboardApi } from "../../services/api/dashboardApi";
import { QUERY_KEYS } from "../../lib/constants";
import { AlertIcon, GroupIcon, TaskIcon, TimeIcon } from "../../icons";
import {
  MONTH_SHORT_LABELS,
  formatDateValue,
  formatMonthLabel,
  formatMonthValue,
  lastDateOfMonth,
  monthStartDate,
  parseMonthValue,
} from "../../utils/monthUtils";

const ALL_MONTHS = "all";

function formatDisplayDate(date: string): string {
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) return date;
  return `${day}-${month}-${year}`;
}

function currentPeriod() {
  const today = formatDateValue(new Date());
  const { year, month } = parseMonthValue(today);
  return { today, year, month };
}

function formatHours(value: number): string {
  const amount = Number(value) || 0;
  const isWhole = Number.isInteger(amount);
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

function InsightsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-36 animate-pulse rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03]"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-80 animate-pulse rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03]"
          />
        ))}
      </div>
    </div>
  );
}

export default function DashboardInsights({
  variant = "headcount",
}: {
  variant?: InsightsVariant;
}) {
  const [initial] = useState(currentPeriod);
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState<string>(String(initial.month));
  const isHours = variant === "hours";
  const yearLabel = String(year);
  const isFullYear = month === ALL_MONTHS;
  const selectedMonth = isFullYear ? undefined : formatMonthValue(year, Number(month));
  const periodStart = isFullYear
    ? `${year}-01-01`
    : monthStartDate(year, Number(month));
  const periodEnd = isFullYear
    ? `${year}-12-31`
    : lastDateOfMonth(year, Number(month));

  const yearOptions = useMemo(() => {
    const currentYear = initial.year;
    return Array.from({ length: 10 }, (_, index) => {
      const value = String(currentYear - index);
      return { value, label: value };
    });
  }, [initial.year]);

  const monthOptions = useMemo(() => {
    const months = MONTH_SHORT_LABELS.map((label, index) => {
      const value = index + 1;
      if (year === initial.year && value > initial.month) {
        return null;
      }
      return { value: String(value), label };
    }).filter((option): option is { value: string; label: string } =>
      Boolean(option),
    );
    return [{ value: ALL_MONTHS, label: "All months" }, ...months];
  }, [year, initial.year, initial.month]);

  const { data, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.dashboard.insights(yearLabel, month),
    queryFn: () => dashboardApi.getInsights(yearLabel, month),
    enabled: !!yearLabel && !!month,
  });

  const adaa = data?.fatTotals.adaa ?? 0;
  const client = data?.fatTotals.client ?? 0;
  const total = data?.total ?? 0;
  const totalHours = data?.totalHours ?? 0;
  const adaaHours = data?.fatTotals.adaaHours ?? 0;
  const clientHours = data?.fatTotals.clientHours ?? 0;
  const idleCount = data?.idleTotals.count ?? 0;
  const idleHours = data?.idleTotals.hours ?? 0;
  const adaaShare = total ? Math.round((adaa / total) * 100) : 0;
  const clientShare = total ? Math.round((client / total) * 100) : 0;
  const adaaHoursShare = totalHours
    ? Math.round((adaaHours / totalHours) * 100)
    : 0;
  const clientHoursShare = totalHours
    ? Math.round((clientHours / totalHours) * 100)
    : 0;

  const periodLabel = isFullYear
    ? yearLabel
    : formatMonthLabel(formatMonthValue(year, Number(month)));

  return (
    <>
      <PageMeta
        title={
          isHours
            ? "Insights by Hours | ADAA Employment LLC"
            : "Insights | ADAA Employment LLC"
        }
        description={
          isHours
            ? "Workforce hours insights by FAT, trade, and client"
            : "Workforce headcount and hours insights by FAT, trade, and client"
        }
      />
      <PageBreadcrumb pageTitle="Dashboard" />
      <DashboardTabs />

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            {isHours ? "Insights by hours" : "Insights"}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {periodLabel}: {formatDisplayDate(periodStart)} to{" "}
            {formatDisplayDate(periodEnd)}
          </p>
        </div>
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:w-auto lg:min-w-[24rem]">
          <div>
            <Label>Year</Label>
            <Select
              options={yearOptions}
              value={yearLabel}
              onChange={(value) => {
                const nextYear = Number(value) || initial.year;
                setYear(nextYear);
                if (month !== ALL_MONTHS) {
                  const nextMonth = Number(month) || initial.month;
                  const maxMonth =
                    nextYear === initial.year ? initial.month : 12;
                  setMonth(String(Math.min(nextMonth, maxMonth)));
                }
              }}
              menuPortal
            />
          </div>
          <div>
            <Label>Month</Label>
            <Select
              options={monthOptions}
              value={month}
              onChange={setMonth}
              menuPortal
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
          Failed to load insights. Please refresh or check the backend.
        </div>
      )}

      {isLoading ? (
        <InsightsSkeleton />
      ) : (
        <>
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
            <StatCard
              label={isHours ? "Total hours" : "On-site headcount"}
              value={isHours ? formatHours(totalHours) : total.toLocaleString()}
              subtitle={
                isHours
                  ? `${total.toLocaleString()} people in this period`
                  : `${formatHours(totalHours)} hrs in this period`
              }
              icon={
                isHours ? (
                  <TimeIcon className="h-6 w-6" />
                ) : (
                  <GroupIcon className="h-6 w-6" />
                )
              }
              accent="brand"
            />
            <StatCard
              label="ADAA"
              value={
                isHours ? formatHours(adaaHours) : adaa.toLocaleString()
              }
              subtitle={`${isHours ? adaaHoursShare : adaaShare}% · ${
                isHours
                  ? `${adaa.toLocaleString()} people`
                  : `${formatHours(adaaHours)} hrs`
              }`}
              icon={<TaskIcon className="h-6 w-6" />}
              accent="blue"
            />
            <StatCard
              label="Client"
              value={
                isHours ? formatHours(clientHours) : client.toLocaleString()
              }
              subtitle={`${isHours ? clientHoursShare : clientShare}% · ${
                isHours
                  ? `${client.toLocaleString()} people`
                  : `${formatHours(clientHours)} hrs`
              }`}
              icon={<GroupIcon className="h-6 w-6" />}
              accent="purple"
            />
            <StatCard
              label={isHours ? "Idle hours" : "Idle headcount"}
              value={
                isHours ? formatHours(idleHours) : idleCount.toLocaleString()
              }
              subtitle={
                isHours
                  ? `${idleCount.toLocaleString()} idle people`
                  : `${formatHours(idleHours)} idle hrs`
              }
              icon={<AlertIcon className="h-6 w-6" />}
              accent={idleCount > 0 ? "orange" : "green"}
            />
          </div>

          <InsightsBoard
            data={data}
            variant={variant}
            selectedMonth={selectedMonth}
            yearLabel={yearLabel}
          />
        </>
      )}
    </>
  );
}
