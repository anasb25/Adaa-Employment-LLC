import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import DashboardTabs from "../../components/dashboard/DashboardTabs";
import Label from "../../components/form/Label";
import { dashboardApi } from "../../services/api/dashboardApi";
import { QUERY_KEYS } from "../../lib/constants";
import {
  ClientFatInsightRow,
  WorkforceInsightRow,
} from "../../types/dashboard";

function todayInputValue(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function formatAsOn(date: string): string {
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) return date;
  return `${day}-${month}-${year}`;
}

function formatPercent(value: number, digits = 2): string {
  return `${value.toFixed(digits)}%`;
}

function InsightTable({
  title,
  rows,
  total,
  percentDigits = 2,
}: {
  title: string;
  rows: WorkforceInsightRow[];
  total: number;
  percentDigits?: number;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-800 dark:text-white">
          {title}
        </h3>
      </div>
      <div className="max-h-[460px] overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-[#e7f0c8] text-gray-800 dark:bg-emerald-900/40 dark:text-emerald-100">
            <tr>
              <th className="px-4 py-2.5 text-left font-semibold">{title}</th>
              <th className="px-4 py-2.5 text-right font-semibold">Head count</th>
              <th className="px-4 py-2.5 text-right font-semibold">Share</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.label}
                className={
                  index % 2 === 1
                    ? "bg-[#efe6f7] dark:bg-violet-950/30"
                    : "bg-white dark:bg-transparent"
                }
              >
                <td className="px-4 py-2 font-medium text-gray-800 dark:text-gray-100">
                  {row.label}
                </td>
                <td className="px-4 py-2 text-right tabular-nums text-gray-900 dark:text-white">
                  <div className="ml-auto flex max-w-[140px] items-center justify-end gap-2">
                    <span
                      className="hidden h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100 sm:block dark:bg-gray-800"
                      aria-hidden
                    >
                      <span
                        className="block h-full rounded-full bg-brand-500"
                        style={{ width: `${Math.min(row.percent, 100)}%` }}
                      />
                    </span>
                    {row.count.toLocaleString()}
                  </div>
                </td>
                <td className="px-4 py-2 text-right tabular-nums text-gray-600 dark:text-gray-300">
                  {formatPercent(row.percent, percentDigits)}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                >
                  No mobilized headcount for this date.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="bg-[#d9e8a8] font-semibold text-gray-900 dark:bg-emerald-900/50 dark:text-emerald-50">
              <td className="px-4 py-2.5">Grand total</td>
              <td className="px-4 py-2.5 text-right tabular-nums">
                {total.toLocaleString()}
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums">
                {total > 0 ? "100%" : "0%"}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

function ClientSplitTable({
  rows,
  adaa,
  client,
  total,
}: {
  rows: ClientFatInsightRow[];
  adaa: number;
  client: number;
  total: number;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-800 dark:text-white">
          Clients by FAT
        </h3>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Headcount split between ADAA and client projects
        </p>
      </div>
      <div className="max-h-[460px] overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-[#e7f0c8] text-gray-800 dark:bg-emerald-900/40 dark:text-emerald-100">
            <tr>
              <th className="px-4 py-2.5 text-left font-semibold">Clients</th>
              <th className="px-4 py-2.5 text-right font-semibold">ADAA</th>
              <th className="px-4 py-2.5 text-right font-semibold">Client</th>
              <th className="px-4 py-2.5 text-right font-semibold">Grand total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.client}
                className={
                  index % 2 === 1
                    ? "bg-[#efe6f7] dark:bg-violet-950/30"
                    : "bg-white dark:bg-transparent"
                }
              >
                <td className="px-4 py-2 font-medium text-gray-800 dark:text-gray-100">
                  {row.client}
                </td>
                <td className="px-4 py-2 text-right tabular-nums">
                  {row.adaa || ""}
                </td>
                <td className="px-4 py-2 text-right tabular-nums">
                  {row.clientFat || ""}
                </td>
                <td className="px-4 py-2 text-right font-medium tabular-nums">
                  {row.total.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-[#d9e8a8] font-semibold text-gray-900 dark:bg-emerald-900/50 dark:text-emerald-50">
              <td className="px-4 py-2.5">Grand total</td>
              <td className="px-4 py-2.5 text-right tabular-nums">{adaa}</td>
              <td className="px-4 py-2.5 text-right tabular-nums">{client}</td>
              <td className="px-4 py-2.5 text-right tabular-nums">
                {total.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

export default function DashboardInsights() {
  const [asOf, setAsOf] = useState(todayInputValue);

  const { data, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.dashboard.insights(asOf),
    queryFn: () => dashboardApi.getInsights(asOf),
    enabled: !!asOf,
  });

  const adaa = data?.fatTotals.adaa ?? 0;
  const client = data?.fatTotals.client ?? 0;
  const total = data?.total ?? 0;
  const adaaShare = total ? Math.round((adaa / total) * 100) : 0;
  const clientShare = total ? Math.round((client / total) * 100) : 0;

  const headingDate = useMemo(() => formatAsOn(asOf), [asOf]);

  return (
    <>
      <PageMeta
        title="Insights | ADAA Employment LLC"
        description="Workforce headcount insights by FAT, trade, and client"
      />
      <PageBreadcrumb pageTitle="Dashboard" />
      <DashboardTabs />

      <div className="mb-6 overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white dark:border-sky-900/40 dark:from-sky-950/40 dark:to-gray-900">
        <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">
              ADAA Employment LLC
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
              Dashboard
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              As on {headingDate}
            </p>
          </div>
          <div className="w-full sm:w-52">
            <Label>As on</Label>
            <input
              type="date"
              value={asOf}
              onChange={(event) => setAsOf(event.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-px bg-sky-100 sm:grid-cols-3 dark:bg-sky-900/40">
          <div className="bg-white/80 px-6 py-4 dark:bg-gray-900/80">
            <p className="text-xs uppercase tracking-wide text-gray-500">Headcount</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-gray-900 dark:text-white">
              {isLoading ? "…" : total.toLocaleString()}
            </p>
          </div>
          <div className="bg-white/80 px-6 py-4 dark:bg-gray-900/80">
            <p className="text-xs uppercase tracking-wide text-gray-500">ADAA</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-gray-900 dark:text-white">
              {isLoading ? "…" : adaa.toLocaleString()}
              <span className="ml-2 text-base font-medium text-gray-500">
                {adaaShare}%
              </span>
            </p>
          </div>
          <div className="bg-white/80 px-6 py-4 dark:bg-gray-900/80">
            <p className="text-xs uppercase tracking-wide text-gray-500">Client</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-gray-900 dark:text-white">
              {isLoading ? "…" : client.toLocaleString()}
              <span className="ml-2 text-base font-medium text-gray-500">
                {clientShare}%
              </span>
            </p>
          </div>
        </div>
        {total > 0 && (
          <div className="flex h-2 w-full overflow-hidden">
            <div className="bg-brand-500" style={{ width: `${adaaShare}%` }} />
            <div className="bg-violet-400" style={{ width: `${clientShare}%` }} />
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
          Failed to load insights. Please refresh or check the backend.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <InsightTable
          title="FAT by"
          rows={data?.fat ?? []}
          total={total}
          percentDigits={0}
        />
        <InsightTable title="Trades" rows={data?.trades ?? []} total={total} />
        <InsightTable title="Clients" rows={data?.clients ?? []} total={total} />
        <ClientSplitTable
          rows={data?.clientsByFat ?? []}
          adaa={adaa}
          client={client}
          total={total}
        />
      </div>
    </>
  );
}
