import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import ComponentCard from "../common/ComponentCard";

type TimesheetStatusChartProps = {
  draft: number;
  submitted: number;
  approved: number;
  rejected: number;
  month: string;
};

export default function TimesheetStatusChart({
  draft,
  submitted,
  approved,
  rejected,
  month,
}: TimesheetStatusChartProps) {
  const options: ApexOptions = {
    chart: {
      type: "bar",
      fontFamily: "Outfit, sans-serif",
      toolbar: { show: false },
    },
    colors: ["#94a3b8", "#3b82f6", "#10b981", "#ef4444"],
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 6,
        barHeight: "55%",
        distributed: true,
      },
    },
    dataLabels: { enabled: true },
    xaxis: {
      categories: ["Draft", "Submitted", "Approved", "Rejected"],
    },
    legend: { show: false },
    grid: { strokeDashArray: 4 },
  };

  const series = [{ name: "Timesheets", data: [draft, submitted, approved, rejected] }];

  return (
    <ComponentCard
      title="Timesheet Status"
      desc={`Project timesheets for ${month}`}
    >
      <Chart options={options} series={series} type="bar" height={260} />
    </ComponentCard>
  );
}
