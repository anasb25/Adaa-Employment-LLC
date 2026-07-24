import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import ComponentCard from "../common/ComponentCard";

type TopProjectsChartProps = {
  projects: Array<{ projectName: string; headcount: number }>;
};

export default function TopProjectsChart({ projects }: TopProjectsChartProps) {
  const categories = projects.map((p) =>
    p.projectName.length > 22
      ? `${p.projectName.slice(0, 22)}…`
      : p.projectName,
  );

  const options: ApexOptions = {
    chart: {
      type: "bar",
      fontFamily: "Outfit, sans-serif",
      toolbar: { show: false },
    },
    colors: ["#465fff"],
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 6,
        barHeight: "60%",
      },
    },
    dataLabels: { enabled: true },
    xaxis: { categories },
    grid: { strokeDashArray: 4 },
    tooltip: {
      y: { formatter: (val: number) => `${val} employees` },
    },
  };

  const series = [{ name: "Headcount", data: projects.map((p) => p.headcount) }];

  return (
    <ComponentCard
      title="Top Projects by Headcount"
      desc="Active employees assigned today"
    >
      {projects.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
          No active project assignments
        </p>
      ) : (
        <Chart options={options} series={series} type="bar" height={Math.max(260, projects.length * 42)} />
      )}
    </ComponentCard>
  );
}
