import { NavLink } from "react-router";

const tabs = [
  { to: "/", label: "Overview", end: true },
  { to: "/insights", label: "Insights", end: false },
];

export default function DashboardTabs() {
  return (
    <div className="mb-6 inline-flex rounded-xl bg-gray-100 p-1 dark:bg-white/5">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            `rounded-lg px-4 py-2 text-sm font-medium transition ${
              isActive
                ? "bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white"
                : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
}
