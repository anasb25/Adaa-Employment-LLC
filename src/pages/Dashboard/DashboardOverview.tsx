import { useMemo, useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import StatCard from "../../components/dashboard/StatCard";
import WorkforceChart from "../../components/dashboard/WorkforceChart";
import TimesheetStatusChart from "../../components/dashboard/TimesheetStatusChart";
import PayrollTrendChart from "../../components/dashboard/PayrollTrendChart";
import TopProjectsChart from "../../components/dashboard/TopProjectsChart";
import SupplierEmployeesChart from "../../components/dashboard/SupplierEmployeesChart";
import InvoiceStatusChart from "../../components/dashboard/InvoiceStatusChart";
import QuickActions from "../../components/dashboard/QuickActions";
import ExpiringDocumentsAlertModal from "../../components/dashboard/ExpiringDocumentsAlertModal";
import { dashboardApi } from "../../services/api/dashboardApi";
import { QUERY_KEYS } from "../../lib/constants";
import {
  GroupIcon,
  BuildingIcon,
  TaskIcon,
  DollarLineIcon,
  AlertIcon,
  DocsIcon,
  CalenderIcon,
} from "../../icons";
import { formatAedAmount } from "../../utils/currency";
import MonthPicker from "../../components/form/MonthPicker";
import { getCurrentMonth } from "../../utils/monthUtils";

export default function DashboardOverview() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [alertsModalOpen, setAlertsModalOpen] = useState(false);
  const hasAutoOpenedAlerts = useRef(false);

  const { data, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.dashboard.stats(selectedMonth),
    queryFn: () => dashboardApi.getStats(selectedMonth),
    refetchInterval: 5 * 60 * 1000,
  });

  const monthLabel = useMemo(() => {
    const [year, month] = selectedMonth.split("-");
    return new Date(Number(year), Number(month) - 1, 1).toLocaleString(
      "default",
      { month: "long", year: "numeric" },
    );
  }, [selectedMonth]);

  useEffect(() => {
    if (
      data &&
      data.counts.expiringDocuments > 0 &&
      !hasAutoOpenedAlerts.current
    ) {
      setAlertsModalOpen(true);
      hasAutoOpenedAlerts.current = true;
    }
  }, [data]);

  return (
    <>
      <PageMeta
        title="Dashboard | ADAA Employment LLC"
        description="ADAA Employment LLC dashboard overview"
      />
      <PageBreadcrumb pageTitle="Dashboard" />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Welcome back
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Overview of workforce, timesheets, payroll, and finance for{" "}
            {monthLabel}
          </p>
        </div>
        <MonthPicker
          value={selectedMonth}
          onChange={setSelectedMonth}
          wrapperClassName="w-44 shrink-0 sm:w-48"
        />
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
          Failed to load dashboard data. Please refresh or check the backend.
        </div>
      )}

      {data && data.counts.expiringDocuments > 0 && (
        <button
          type="button"
          onClick={() => setAlertsModalOpen(true)}
          className="mb-6 flex w-full items-center gap-3 rounded-2xl border border-orange-200 bg-orange-50 px-5 py-4 text-left transition hover:bg-orange-100 dark:border-orange-900/50 dark:bg-orange-900/20 dark:hover:bg-orange-900/30"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300">
            <AlertIcon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-orange-900 dark:text-orange-200">
              {data.counts.expiringDocuments} employees have documents expiring
              soon
            </p>
            <p className="text-sm text-orange-700 dark:text-orange-300/80">
              Click to review passport, visa, Emirates ID, and work permit
              alerts
            </p>
          </div>
          <span className="hidden rounded-lg bg-orange-200 px-3 py-1.5 text-xs font-semibold text-orange-900 sm:inline dark:bg-orange-900/50 dark:text-orange-100">
            View alerts
          </span>
        </button>
      )}

      <ExpiringDocumentsAlertModal
        isOpen={alertsModalOpen}
        onClose={() => setAlertsModalOpen(false)}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
        <StatCard
          label="Total Employees"
          value={isLoading ? "…" : data?.counts.employees ?? 0}
          subtitle={
            isLoading
              ? undefined
              : `${data?.counts.adaaEmployees ?? 0} ADAA · ${data?.counts.otherEmployees ?? 0} other`
          }
          icon={<GroupIcon className="h-6 w-6" />}
          href="/employees"
          accent="brand"
        />
        <StatCard
          label="ADAA Employees"
          value={isLoading ? "…" : data?.counts.adaaEmployees ?? 0}
          subtitle="Assigned to ADAA supplier"
          icon={<GroupIcon className="h-6 w-6" />}
          href="/employees"
          accent="blue"
        />
        <StatCard
          label="Other Employees"
          value={isLoading ? "…" : data?.counts.otherEmployees ?? 0}
          subtitle="Non-ADAA suppliers & unassigned"
          icon={<GroupIcon className="h-6 w-6" />}
          href="/employees"
          accent="orange"
        />
        <StatCard
          label="Mobilized Workforce"
          value={isLoading ? "…" : data?.workforce.total ?? 0}
          icon={<TaskIcon className="h-6 w-6" />}
          href="/mobilizations/daily"
          accent="green"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
        <StatCard
          label="Gross Salary"
          value={
            isLoading
              ? "…"
              : formatAedAmount(data?.payroll.totalGross ?? 0)
          }
          subtitle={`${data?.payroll.records ?? 0} ADAA records · ${Math.round(data?.payroll.totalHours ?? 0).toLocaleString()} hrs`}
          icon={<DollarLineIcon className="h-6 w-6" />}
          href="/payroll"
          accent="purple"
        />
        <StatCard
          label="Net Salary"
          value={
            isLoading
              ? "…"
              : formatAedAmount(data?.payroll.totalNet ?? 0)
          }
          subtitle="ADAA payroll only for selected month"
          icon={<DollarLineIcon className="h-6 w-6" />}
          href="/payroll"
          accent="green"
        />
        <StatCard
          label="Active Projects"
          value={isLoading ? "…" : data?.counts.projects ?? 0}
          subtitle={`${data?.counts.clients ?? 0} clients`}
          icon={<BuildingIcon className="h-6 w-6" />}
          href="/projects"
          accent="blue"
        />
        <StatCard
          label="Pending Timesheets"
          value={isLoading ? "…" : data?.timesheets.submitted ?? 0}
          subtitle={`${data?.timesheets.approved ?? 0} approved this month`}
          icon={<CalenderIcon className="h-6 w-6" />}
          href="/timesheets/monthly"
          accent="orange"
        />
        <StatCard
          label="Outstanding Invoices"
          value={
            isLoading
              ? "…"
              : formatAedAmount(data?.invoices.outstandingAmount ?? 0)
          }
          subtitle={`${data?.invoices.sent ?? 0} sent · ${data?.invoices.paid ?? 0} paid`}
          icon={<DocsIcon className="h-6 w-6" />}
          href="/invoices"
          accent="blue"
        />
        <StatCard
          label="Document Alerts"
          value={isLoading ? "…" : data?.counts.expiringDocuments ?? 0}
          subtitle="Expiring within 15 days · click to view"
          icon={<AlertIcon className="h-6 w-6" />}
          onClick={() => setAlertsModalOpen(true)}
          accent={data && data.counts.expiringDocuments > 0 ? "red" : "green"}
        />
      </div>

      {data && (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-12 md:gap-6">
            <div className="xl:col-span-5">
              <SupplierEmployeesChart suppliers={data.employeesBySupplier} />
            </div>
            <div className="xl:col-span-7">
              <PayrollTrendChart trend={data.payrollTrend} />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-12 md:gap-6">
            <div className="xl:col-span-5">
              <WorkforceChart
                active={data.workforce.active}
                idle={data.workforce.idle}
                onLeave={data.workforce.onLeave}
                off={data.workforce.off}
                other={data.workforce.other}
              />
            </div>
            <div className="xl:col-span-7">
              <TimesheetStatusChart
                draft={data.timesheets.draft}
                submitted={data.timesheets.submitted}
                approved={data.timesheets.approved}
                rejected={data.timesheets.rejected}
                month={monthLabel}
              />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2 md:gap-6">
            <InvoiceStatusChart
              draft={data.invoices.draft}
              pending={data.invoices.pending}
              approved={data.invoices.approved}
              sent={data.invoices.sent}
              paid={data.invoices.paid}
              cancelled={data.invoices.cancelled}
              month={monthLabel}
            />
            <TopProjectsChart projects={data.topProjects} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3 md:gap-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 xl:col-span-1">
              <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
                Settlements
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Final settlement pipeline
              </p>
              <div className="mt-5 space-y-3">
                {[
                  ["Draft", data.settlements.draft],
                  ["Pending Approval", data.settlements.pendingApproval],
                  ["Approved", data.settlements.approved],
                  ["Paid", data.settlements.paid],
                ].map(([label, count]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800/50"
                  >
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {label}
                    </span>
                    <span className="text-sm font-semibold text-gray-800 dark:text-white">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="xl:col-span-2">
              <QuickActions />
            </div>
          </div>
        </>
      )}

      {isLoading && !data && (
        <div className="mt-10 flex items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      )}
    </>
  );
}
