import { Link } from "react-router";
import {
  GroupIcon,
  TaskIcon,
  CalenderIcon,
  DollarLineIcon,
  DocsIcon,
  ListIcon,
  AlertIcon,
} from "../../icons";

const actions = [
  {
    name: "Employees",
    path: "/employees",
    icon: GroupIcon,
    color: "text-brand-600 bg-brand-50 dark:bg-brand-500/10",
  },
  {
    name: "Mobilizations",
    path: "/mobilizations/daily",
    icon: TaskIcon,
    color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10",
  },
  {
    name: "Timesheets",
    path: "/timesheets/monthly",
    icon: CalenderIcon,
    color: "text-blue-600 bg-blue-50 dark:bg-blue-500/10",
  },
  {
    name: "Payroll",
    path: "/payroll",
    icon: DollarLineIcon,
    color: "text-purple-600 bg-purple-50 dark:bg-purple-500/10",
  },
  {
    name: "Invoices",
    path: "/invoices",
    icon: DocsIcon,
    color: "text-orange-600 bg-orange-50 dark:bg-orange-500/10",
  },
  {
    name: "Settlements",
    path: "/settlements",
    icon: ListIcon,
    color: "text-slate-600 bg-slate-100 dark:bg-slate-500/10",
  },
  {
    name: "Expiry Alerts",
    path: "/expiry-alerts",
    icon: AlertIcon,
    color: "text-red-600 bg-red-50 dark:bg-red-500/10",
  },
];

export default function QuickActions() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
        Quick Actions
      </h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Jump to common tasks
      </p>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.path}
              to={action.path}
              className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 p-4 text-center transition hover:border-brand-200 hover:bg-brand-50/40 dark:border-gray-800 dark:hover:border-brand-500/30 dark:hover:bg-brand-500/5"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${action.color}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {action.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
