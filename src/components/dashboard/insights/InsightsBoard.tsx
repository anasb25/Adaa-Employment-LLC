import type { ReactNode } from "react";
import { formatAedAmount } from "../../../utils/currency";
import {
  ClientFatInsightRow,
  ExpiryInsightBucket,
  IdleTradeInsightRow,
  MonthlyHoursInsightRow,
  MonthlyMoneyInsightRow,
  StatusInsightRow,
  WorkforceInsightRow,
  WorkforceInsights,
} from "../../../types/dashboard";

export type InsightsVariant = "headcount" | "hours";

function formatHours(value: number): string {
  const amount = Number(value) || 0;
  const isWhole = Number.isInteger(amount);
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

function formatCount(value: number): string {
  return (Number(value) || 0).toLocaleString();
}

function formatPercent(value: number, digits = 1): string {
  return `${(Number(value) || 0).toFixed(digits)}%`;
}

function InsightPanel({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] ${className}`}
    >
      <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
        <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
          {title}
        </h3>
        {description ? (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
    </section>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {title}
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

function ShareBar({
  value,
  color = "bg-brand-500",
}: {
  value: number;
  color?: string;
}) {
  const width = Math.max(0, Math.min(Number(value) || 0, 100));
  return (
    <div className="flex min-w-[7.5rem] items-center justify-end gap-2">
      <span
        className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-gray-100 sm:block dark:bg-gray-800"
        aria-hidden
      >
        <span
          className={`block h-full rounded-full ${color}`}
          style={{ width: `${width}%` }}
        />
      </span>
      <span className="w-12 text-right tabular-nums text-gray-500 dark:text-gray-400">
        {formatPercent(value)}
      </span>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-full min-h-[12rem] items-center justify-center px-6 text-center text-sm text-gray-500 dark:text-gray-400">
      {message}
    </div>
  );
}

function StackedValue({
  primary,
  secondary,
}: {
  primary: string;
  secondary: string;
}) {
  return (
    <div className="text-right">
      <p className="font-medium tabular-nums text-gray-800 dark:text-white/90">
        {primary}
      </p>
      <p className="text-xs tabular-nums text-gray-500 dark:text-gray-400">
        {secondary}
      </p>
    </div>
  );
}

const fatColors: Record<string, string> = {
  ADAA: "bg-brand-500",
  CLIENT: "bg-violet-500",
  UNSPECIFIED: "bg-gray-400",
};

function FatMix({
  rows,
  total,
  totalHours,
  variant,
}: {
  rows: WorkforceInsightRow[];
  total: number;
  totalHours: number;
  variant: InsightsVariant;
}) {
  const hoursFirst = variant === "hours";

  return (
    <InsightPanel
      title="FAT mix"
      description="Share of on-site workforce between ADAA and client projects"
    >
      {rows.length === 0 ? (
        <EmptyState message="No data for this period." />
      ) : (
        <div className="flex h-full flex-col justify-between gap-8 p-5">
          <div className="space-y-5">
            {rows.map((row) => {
              const share = hoursFirst ? row.hoursPercent : row.percent;
              return (
                <div key={row.label}>
                  <div className="mb-2 flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white/90">
                        {row.label}
                      </p>
                      <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                        {formatCount(row.count)} people · {formatHours(row.hours)}{" "}
                        hrs
                      </p>
                    </div>
                    <p className="text-xl font-semibold tabular-nums text-gray-800 dark:text-white/90">
                      {hoursFirst ? formatHours(row.hours) : formatCount(row.count)}
                    </p>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      className={`h-full rounded-full ${fatColors[row.label] ?? "bg-brand-500"}`}
                      style={{ width: `${Math.min(share, 100)}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs tabular-nums text-gray-500 dark:text-gray-400">
                    {formatPercent(share, 0)} of {hoursFirst ? "hours" : "headcount"}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between border-t border-gray-100 pt-4 text-sm dark:border-gray-800">
            <span className="font-medium text-gray-700 dark:text-gray-200">
              Total
            </span>
            <span className="tabular-nums text-gray-800 dark:text-white/90">
              {formatCount(total)} people · {formatHours(totalHours)} hrs
            </span>
          </div>
        </div>
      )}
    </InsightPanel>
  );
}

function MixTable({
  title,
  description,
  labelHeader,
  rows,
  total,
  totalHours,
  variant,
  empty,
}: {
  title: string;
  description: string;
  labelHeader: string;
  rows: WorkforceInsightRow[];
  total: number;
  totalHours: number;
  variant: InsightsVariant;
  empty: string;
}) {
  const hoursFirst = variant === "hours";

  return (
    <InsightPanel title={title} description={description}>
      {rows.length === 0 ? (
        <EmptyState message={empty} />
      ) : (
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-gray-50 text-gray-600 dark:bg-white/[0.04] dark:text-gray-300">
            <tr>
              <th className="px-5 py-3 text-left font-medium">{labelHeader}</th>
              <th className="px-5 py-3 text-right font-medium">
                {hoursFirst ? "Hours" : "Headcount"}
              </th>
              <th className="px-5 py-3 text-right font-medium">Share</th>
              <th className="px-5 py-3 text-right font-medium">
                {hoursFirst ? "Headcount" : "Hours"}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map((row) => {
              const primary = hoursFirst ? row.hours : row.count;
              const secondary = hoursFirst ? row.count : row.hours;
              const share = hoursFirst ? row.hoursPercent : row.percent;
              return (
                <tr
                  key={row.label}
                  className="hover:bg-gray-50/80 dark:hover:bg-white/[0.02]"
                >
                  <td className="px-5 py-2.5 font-medium text-gray-800 dark:text-gray-100">
                    {row.label}
                  </td>
                  <td className="px-5 py-2.5 text-right tabular-nums text-gray-800 dark:text-white/90">
                    {hoursFirst ? formatHours(primary) : formatCount(primary)}
                  </td>
                  <td className="px-5 py-2.5">
                    <ShareBar value={share} />
                  </td>
                  <td className="px-5 py-2.5 text-right tabular-nums text-gray-500 dark:text-gray-400">
                    {hoursFirst ? formatCount(secondary) : formatHours(secondary)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-gray-200 bg-gray-50 font-medium text-gray-800 dark:border-gray-800 dark:bg-white/[0.04] dark:text-white/90">
              <td className="px-5 py-3">Total</td>
              <td className="px-5 py-3 text-right tabular-nums">
                {hoursFirst ? formatHours(totalHours) : formatCount(total)}
              </td>
              <td className="px-5 py-3 text-right tabular-nums text-gray-500 dark:text-gray-400">
                100%
              </td>
              <td className="px-5 py-3 text-right tabular-nums text-gray-500 dark:text-gray-400">
                {hoursFirst ? formatCount(total) : formatHours(totalHours)}
              </td>
            </tr>
          </tfoot>
        </table>
      )}
    </InsightPanel>
  );
}

function ClientSplitTable({
  rows,
  adaa,
  client,
  adaaHours,
  clientHours,
  total,
  totalHours,
}: {
  rows: ClientFatInsightRow[];
  adaa: number;
  client: number;
  adaaHours: number;
  clientHours: number;
  total: number;
  totalHours: number;
}) {
  return (
    <InsightPanel
      title="Clients by FAT"
      description="How each client’s on-site team is split between ADAA and client FAT"
    >
      {rows.length === 0 ? (
        <EmptyState message="No client data for this period." />
      ) : (
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-gray-50 text-gray-600 dark:bg-white/[0.04] dark:text-gray-300">
            <tr>
              <th className="px-5 py-3 text-left font-medium">Client</th>
              <th className="px-5 py-3 text-right font-medium">ADAA</th>
              <th className="px-5 py-3 text-right font-medium">Client FAT</th>
              <th className="px-5 py-3 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map((row) => (
              <tr
                key={row.client}
                className="hover:bg-gray-50/80 dark:hover:bg-white/[0.02]"
              >
                <td className="px-5 py-2.5 font-medium text-gray-800 dark:text-gray-100">
                  {row.client}
                </td>
                <td className="px-5 py-2.5">
                  <StackedValue
                    primary={formatCount(row.adaa)}
                    secondary={`${formatHours(row.adaaHours)} hrs`}
                  />
                </td>
                <td className="px-5 py-2.5">
                  <StackedValue
                    primary={formatCount(row.clientFat)}
                    secondary={`${formatHours(row.clientHours)} hrs`}
                  />
                </td>
                <td className="px-5 py-2.5">
                  <StackedValue
                    primary={formatCount(row.total)}
                    secondary={`${formatHours(row.totalHours)} hrs`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-gray-200 bg-gray-50 font-medium text-gray-800 dark:border-gray-800 dark:bg-white/[0.04] dark:text-white/90">
              <td className="px-5 py-3">Total</td>
              <td className="px-5 py-3">
                <StackedValue
                  primary={formatCount(adaa)}
                  secondary={`${formatHours(adaaHours)} hrs`}
                />
              </td>
              <td className="px-5 py-3">
                <StackedValue
                  primary={formatCount(client)}
                  secondary={`${formatHours(clientHours)} hrs`}
                />
              </td>
              <td className="px-5 py-3">
                <StackedValue
                  primary={formatCount(total)}
                  secondary={`${formatHours(totalHours)} hrs`}
                />
              </td>
            </tr>
          </tfoot>
        </table>
      )}
    </InsightPanel>
  );
}

function IdleTable({
  rows,
  totals,
  variant,
}: {
  rows: IdleTradeInsightRow[];
  totals: { count: number; hours: number };
  variant: InsightsVariant;
}) {
  const hoursFirst = variant === "hours";
  const activeRows = rows.filter((row) => row.count > 0 || row.hours > 0);
  const sorted = [...activeRows].sort((a, b) =>
    hoursFirst
      ? b.hours - a.hours || a.trade.localeCompare(b.trade)
      : b.count - a.count || a.trade.localeCompare(b.trade),
  );

  return (
    <InsightPanel
      title="Idle by trade"
      description="Idle employees in the selected period, grouped by trade"
    >
      {sorted.length === 0 ? (
        <EmptyState message="No idle employees in this period." />
      ) : (
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-gray-50 text-gray-600 dark:bg-white/[0.04] dark:text-gray-300">
            <tr>
              <th className="px-5 py-3 text-left font-medium">Trade</th>
              <th className="px-5 py-3 text-right font-medium">
                {hoursFirst ? "Hours" : "Headcount"}
              </th>
              <th className="px-5 py-3 text-right font-medium">
                {hoursFirst ? "Headcount" : "Hours"}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {sorted.map((row) => (
              <tr
                key={row.trade}
                className="hover:bg-gray-50/80 dark:hover:bg-white/[0.02]"
              >
                <td className="px-5 py-2.5 font-medium text-gray-800 dark:text-gray-100">
                  {row.trade}
                </td>
                <td className="px-5 py-2.5 text-right tabular-nums text-gray-800 dark:text-white/90">
                  {hoursFirst ? formatHours(row.hours) : formatCount(row.count)}
                </td>
                <td className="px-5 py-2.5 text-right tabular-nums text-gray-500 dark:text-gray-400">
                  {hoursFirst ? formatCount(row.count) : formatHours(row.hours)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-amber-200 bg-amber-50 font-medium text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
              <td className="px-5 py-3">Idle total</td>
              <td className="px-5 py-3 text-right tabular-nums">
                {hoursFirst
                  ? formatHours(totals.hours)
                  : formatCount(totals.count)}
              </td>
              <td className="px-5 py-3 text-right tabular-nums">
                {hoursFirst
                  ? formatCount(totals.count)
                  : formatHours(totals.hours)}
              </td>
            </tr>
          </tfoot>
        </table>
      )}
    </InsightPanel>
  );
}

const statusStyles: Record<
  string,
  { wrap: string; icon: string; label: string }
> = {
  ACTIVE: {
    wrap: "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/40 dark:bg-emerald-950/20",
    icon: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    label: "Active",
  },
  IDLE: {
    wrap: "border-amber-200 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-950/20",
    icon: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    label: "Idle",
  },
  HOLD: {
    wrap: "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40",
    icon: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    label: "Hold",
  },
  ABSENT: {
    wrap: "border-rose-200 bg-rose-50/70 dark:border-rose-900/40 dark:bg-rose-950/20",
    icon: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    label: "Absent",
  },
};

function StatusGrid({ rows }: { rows: StatusInsightRow[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {rows.map((row) => {
        const style = statusStyles[row.label] ?? statusStyles.HOLD;
        return (
          <article
            key={row.label}
            className={`rounded-2xl border p-5 ${style.wrap}`}
          >
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {style.label}
            </p>
            <p className="mt-3 text-3xl font-semibold tabular-nums text-gray-900 dark:text-white">
              {formatCount(row.count)}
            </p>
            <p className="mt-1 text-sm tabular-nums text-gray-500 dark:text-gray-400">
              {formatHours(row.hours)} hrs
            </p>
          </article>
        );
      })}
    </div>
  );
}

function ExpiryCard({
  title,
  description,
  bucket,
  urgent,
}: {
  title: string;
  description: string;
  bucket: ExpiryInsightBucket;
  urgent?: boolean;
}) {
  const items = [
    { label: "Visa", value: bucket.visa },
    { label: "Emirates ID", value: bucket.eid },
    { label: "Insurance", value: bucket.workPermit },
    { label: "Passport", value: bucket.passport },
  ];

  return (
    <InsightPanel title={title} description={description}>
      <div className="flex h-full flex-col p-5">
        <div className="mb-5 flex items-end justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">Documents</p>
          <p
            className={`text-3xl font-semibold tabular-nums ${
              urgent && bucket.total > 0
                ? "text-orange-600 dark:text-orange-400"
                : "text-gray-900 dark:text-white"
            }`}
          >
            {formatCount(bucket.total)}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-3 dark:border-gray-800 dark:bg-white/[0.03]"
            >
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {item.label}
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-gray-800 dark:text-white/90">
                {formatCount(item.value)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </InsightPanel>
  );
}

function monthRowClass(month: string, selectedMonth?: string): string {
  return month === selectedMonth
    ? "bg-brand-50 dark:bg-brand-500/10"
    : "hover:bg-gray-50/80 dark:hover:bg-white/[0.02]";
}

function MonthlyHoursTable({
  rows,
  selectedMonth,
  yearLabel,
}: {
  rows: MonthlyHoursInsightRow[];
  selectedMonth?: string;
  yearLabel?: string;
}) {
  return (
    <InsightPanel
      title="Monthly hours"
      description={
        yearLabel
          ? `Timesheet hours and unique people in ${yearLabel}`
          : "Timesheet hours and unique people by month"
      }
    >
      {rows.length === 0 ? (
        <EmptyState message="No timesheet hours yet." />
      ) : (
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-gray-50 text-gray-600 dark:bg-white/[0.04] dark:text-gray-300">
            <tr>
              <th className="px-5 py-3 text-left font-medium">Month</th>
              <th className="px-5 py-3 text-right font-medium">Headcount</th>
              <th className="px-5 py-3 text-right font-medium">Hours</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map((row) => (
              <tr
                key={row.month}
                className={monthRowClass(row.month, selectedMonth)}
              >
                <td className="px-5 py-2.5 font-medium text-gray-800 dark:text-gray-100">
                  {row.label}
                </td>
                <td className="px-5 py-2.5 text-right tabular-nums">
                  {formatCount(row.headcount)}
                </td>
                <td className="px-5 py-2.5 text-right tabular-nums">
                  {formatHours(row.hours)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </InsightPanel>
  );
}

function MonthlyMoneyTable({
  title,
  description,
  rows,
  selectedMonth,
}: {
  title: string;
  description: string;
  rows: MonthlyMoneyInsightRow[];
  selectedMonth?: string;
}) {
  return (
    <InsightPanel title={title} description={description}>
      {rows.length === 0 ? (
        <EmptyState message="No records yet." />
      ) : (
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-gray-50 text-gray-600 dark:bg-white/[0.04] dark:text-gray-300">
            <tr>
              <th className="px-5 py-3 text-left font-medium">Month</th>
              <th className="px-5 py-3 text-right font-medium">Headcount</th>
              <th className="px-5 py-3 text-right font-medium">Hours</th>
              <th className="px-5 py-3 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map((row) => (
              <tr
                key={row.month}
                className={monthRowClass(row.month, selectedMonth)}
              >
                <td className="px-5 py-2.5 font-medium text-gray-800 dark:text-gray-100">
                  {row.label}
                </td>
                <td className="px-5 py-2.5 text-right tabular-nums">
                  {formatCount(row.headcount)}
                </td>
                <td className="px-5 py-2.5 text-right tabular-nums">
                  {formatHours(row.hours)}
                </td>
                <td className="px-5 py-2.5 text-right tabular-nums">
                  {formatAedAmount(row.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </InsightPanel>
  );
}

function sortedMix(
  rows: WorkforceInsightRow[],
  variant: InsightsVariant,
): WorkforceInsightRow[] {
  return [...rows].sort((a, b) =>
    variant === "hours"
      ? b.hours - a.hours || a.label.localeCompare(b.label)
      : b.count - a.count || a.label.localeCompare(b.label),
  );
}

export default function InsightsBoard({
  data,
  variant,
  selectedMonth,
  yearLabel,
}: {
  data?: WorkforceInsights;
  variant: InsightsVariant;
  selectedMonth?: string;
  yearLabel?: string;
}) {
  const total = data?.total ?? 0;
  const totalHours = data?.totalHours ?? 0;
  const emptyExpiry: ExpiryInsightBucket = {
    visa: 0,
    eid: 0,
    workPermit: 0,
    passport: 0,
    total: 0,
  };

  return (
    <div className="space-y-8">
      <Section
        title="Workforce mix"
        description="Headcount and hours for the selected period by FAT, trade, and client"
      >
        <div className="grid grid-cols-1 items-stretch gap-6 xl:grid-cols-2">
          <div className="min-h-[22rem]">
            <FatMix
              rows={data?.fat ?? []}
              total={total}
              totalHours={totalHours}
              variant={variant}
            />
          </div>
          <div className="min-h-[22rem]">
            <MixTable
              title="Trades"
              description="Workforce distribution across mobilized trades"
              labelHeader="Trade"
              rows={sortedMix(data?.trades ?? [], variant)}
              total={total}
              totalHours={totalHours}
              variant={variant}
              empty="No trade hours for this period."
            />
          </div>
          <div className="min-h-[22rem]">
            <MixTable
              title="Clients"
              description="On-site people and hours by client"
              labelHeader="Client"
              rows={sortedMix(data?.clients ?? [], variant)}
              total={total}
              totalHours={totalHours}
              variant={variant}
              empty="No client hours for this period."
            />
          </div>
          <div className="min-h-[22rem]">
            <IdleTable
              rows={data?.idleByTrade ?? []}
              totals={data?.idleTotals ?? { count: 0, hours: 0 }}
              variant={variant}
            />
          </div>
        </div>
        <ClientSplitTable
          rows={data?.clientsByFat ?? []}
          adaa={data?.fatTotals.adaa ?? 0}
          client={data?.fatTotals.client ?? 0}
          adaaHours={data?.fatTotals.adaaHours ?? 0}
          clientHours={data?.fatTotals.clientHours ?? 0}
          total={total}
          totalHours={totalHours}
        />
      </Section>

      <Section
        title="Status and documents"
        description="Job status and document expiries at the end of the selected period"
      >
        <StatusGrid rows={data?.status ?? []} />
        <div className="grid grid-cols-1 items-stretch gap-6 xl:grid-cols-2">
          <ExpiryCard
            title="Expiring in 15 days"
            description="Documents already expired or due within 15 days"
            bucket={data?.expiry.next15 ?? emptyExpiry}
            urgent
          />
          <ExpiryCard
            title="Expiring in one month"
            description="Documents due between 16 and 30 days"
            bucket={data?.expiry.oneMonth ?? emptyExpiry}
          />
        </div>
      </Section>

      <Section
        title="Monthly totals"
        description={
          yearLabel
            ? `Hours and ADAA payroll for ${yearLabel}`
            : "Hours and ADAA payroll by month"
        }
      >
        <div className="grid grid-cols-1 items-stretch gap-6 xl:grid-cols-2">
          <MonthlyHoursTable
            rows={data?.monthlyHours ?? []}
            selectedMonth={selectedMonth}
            yearLabel={yearLabel}
          />
          <MonthlyMoneyTable
            title="Payroll"
            description={
              yearLabel
                ? `ADAA gross payroll in ${yearLabel}`
                : "ADAA gross payroll by month"
            }
            rows={data?.monthlyPayroll ?? []}
            selectedMonth={selectedMonth}
          />
        </div>
      </Section>
    </div>
  );
}
