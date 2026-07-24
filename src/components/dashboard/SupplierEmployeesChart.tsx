import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import ComponentCard from "../common/ComponentCard";

type SupplierEmployeesChartProps = {
  suppliers: Array<{ supplierName: string; count: number }>;
};

const SUPPLIER_COLORS = ["#465fff", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4"];

function truncateLabel(name: string, max = 28): string {
  return name.length > max ? `${name.slice(0, max)}…` : name;
}

export default function SupplierEmployeesChart({
  suppliers,
}: SupplierEmployeesChartProps) {
  const sorted = [...suppliers].sort((a, b) => b.count - a.count);
  const total = sorted.reduce((sum, row) => sum + row.count, 0);

  const options: ApexOptions = {
    chart: {
      type: "bar",
      fontFamily: "Outfit, sans-serif",
      toolbar: { show: false },
    },
    colors: sorted.map(
      (_, index) => SUPPLIER_COLORS[index % SUPPLIER_COLORS.length],
    ),
    plotOptions: {
      bar: {
        horizontal: true,
        distributed: true,
        borderRadius: 6,
        barHeight: "62%",
      },
    },
    dataLabels: { enabled: true },
    legend: { show: false },
    xaxis: {
      categories: sorted.map((row) => truncateLabel(row.supplierName)),
    },
    grid: { strokeDashArray: 4 },
    tooltip: {
      y: { formatter: (val: number) => `${val} employee(s)` },
    },
  };

  const fullNameByIndex = sorted.map((row) => row.supplierName);
  options.tooltip = {
    ...options.tooltip,
    custom: ({ series, seriesIndex, dataPointIndex, w }) => {
      const value = series[seriesIndex][dataPointIndex];
      const name = fullNameByIndex[dataPointIndex] ?? w.globals.labels[dataPointIndex];
      return `<div class="apexcharts-tooltip-title" style="font-family: Outfit, sans-serif; padding: 6px 10px;">${name}</div><div style="padding: 4px 10px 8px; font-family: Outfit, sans-serif;">${value} employee(s)</div>`;
    },
  };

  const series = [{ name: "Employees", data: sorted.map((row) => row.count) }];

  return (
    <ComponentCard
      title="Employees by Supplier"
      desc={`${total.toLocaleString()} employees across ${sorted.length} supplier group(s)`}
    >
      {sorted.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
          No employees found
        </p>
      ) : (
        <Chart
          options={options}
          series={series}
          type="bar"
          height={Math.max(240, sorted.length * 52)}
        />
      )}
    </ComponentCard>
  );
}
