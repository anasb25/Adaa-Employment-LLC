import { Link } from "react-router";
import { ExcelIcon } from "../../icons";

type StatCardAction = {
  label: string;
  onClick: () => void;
  loading?: boolean;
  variant?: "default" | "excel";
};

type StatCardProps = {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  action?: StatCardAction;
  accent?: "brand" | "green" | "orange" | "red" | "purple" | "blue";
};

const accentStyles = {
  brand: "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400",
  green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  orange: "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
  red: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
  purple: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
};

export default function StatCard({
  label,
  value,
  subtitle,
  icon,
  href,
  onClick,
  action,
  accent = "brand",
}: StatCardProps) {
  const content = (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="flex items-center justify-between gap-3">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${accentStyles[accent]}`}
        >
          {icon}
        </div>
        {action && (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              action.onClick();
            }}
            disabled={action.loading}
            className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
              action.variant === "excel"
                ? "border border-[#217346] bg-[#217346] text-white hover:bg-[#1a5c38] dark:border-[#217346] dark:bg-[#217346] dark:hover:bg-[#1a5c38]"
                : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            }`}
          >
            {action.variant === "excel" && (
              <ExcelIcon className="h-4 w-4 shrink-0 text-white" />
            )}
            {action.loading ? "Downloading…" : action.label}
          </button>
        )}
      </div>
      <div className="mt-5">
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <h4 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white/90">
          {value}
        </h4>
        {subtitle && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="block w-full cursor-pointer text-left"
      >
        {content}
      </button>
    );
  }

  if (href) {
    return (
      <Link to={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
