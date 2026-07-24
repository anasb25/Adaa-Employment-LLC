import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import ComponentCard from "../common/ComponentCard";
import { formatAedAmount, formatAedAxis } from "../../utils/currency";

type PayrollTrendChartProps = {
  trend: Array<{ month: string; gross: number; net: number }>;
};

function formatMonthLabel(month: string) {
  const [year, monthNum] = month.split("-");
  const date = new Date(Number(year), Number(monthNum) - 1, 1);
  return date.toLocaleString("default", { month: "short", year: "2-digit" });
}

export default function PayrollTrendChart({ trend }: PayrollTrendChartProps) {
  const categories = trend.map((item) => formatMonthLabel(item.month));

  const options: ApexOptions = {
    chart: {
      type: "line",
      fontFamily: "Outfit, sans-serif",
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    colors: ["#465fff", "#10b981"],
    stroke: { curve: "smooth", width: 3 },
    markers: {
      size: 7,
      strokeWidth: 2,
      strokeColors: ["#fff", "#fff"],
      fillOpacity: 1,
      hover: {
        size: 9,
        sizeOffset: 2,
      },
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.35,
        opacityTo: 0.05,
        stops: [0, 90, 100],
      },
    },
    dataLabels: { enabled: false },
    xaxis: { categories },
    yaxis: {
      labels: {
        formatter: (val: number) => formatAedAxis(val),
      },
    },
    legend: {
      position: "top",
      horizontalAlign: "right",
    },
    grid: { strokeDashArray: 4 },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: (val: number) => formatAedAmount(val),
      },
    },
  };

  const series = [
    { name: "Gross Salary", data: trend.map((item) => item.gross) },
    { name: "Net Salary", data: trend.map((item) => item.net) },
  ];

  return (
    <ComponentCard
      title="Payroll Trend"
      desc="Monthly gross and net salary totals (AED)"
    >
      {trend.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
          No payroll data yet
        </p>
      ) : (
        <>
          <Chart options={options} series={series} type="line" height={300} />
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  <th className="pb-2 pr-4 font-medium">Month</th>
                  <th className="pb-2 pr-4 font-medium">Gross Salary</th>
                  <th className="pb-2 font-medium">Net Salary</th>
                </tr>
              </thead>
              <tbody>
                {[...trend].reverse().map((item) => (
                  <tr
                    key={item.month}
                    className="border-b border-gray-50 last:border-0 dark:border-gray-800/60"
                  >
                    <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">
                      {formatMonthLabel(item.month)}
                    </td>
                    <td className="py-2 pr-4 font-medium text-brand-600 dark:text-brand-400">
                      {formatAedAmount(item.gross)}
                    </td>
                    <td className="py-2 font-medium text-emerald-600 dark:text-emerald-400">
                      {formatAedAmount(item.net)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </ComponentCard>
  );
}
