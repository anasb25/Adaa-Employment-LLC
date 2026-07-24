import { Link } from "react-router";

type StatCardProps = {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
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
  accent = "brand",
}: StatCardProps) {
  const content = (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-xl ${accentStyles[accent]}`}
      >
        {icon}
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
