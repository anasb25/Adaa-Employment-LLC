import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import ComponentCard from "../common/ComponentCard";

type WorkforceChartProps = {
  active: number;
  idle: number;
  onLeave: number;
  off: number;
  other: number;
};

export default function WorkforceChart({
  active,
  idle,
  onLeave,
  off,
  other,
}: WorkforceChartProps) {
  const series = [active, idle, onLeave, off, other];
  const labels = ["Active", "Idle", "On Leave", "Off", "Other"];

  const options: ApexOptions = {
    chart: { type: "donut", fontFamily: "Outfit, sans-serif" },
    labels,
    colors: ["#465fff", "#f59e0b", "#ef4444", "#94a3b8", "#8b5cf6"],
    legend: { position: "bottom", fontFamily: "Outfit, sans-serif" },
    dataLabels: { enabled: true },
    plotOptions: {
      pie: {
        donut: {
          size: "68%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Workforce",
              fontSize: "14px",
              fontWeight: 600,
            },
          },
        },
      },
    },
    stroke: { width: 0 },
  };

  return (
    <ComponentCard title="Workforce Today" desc="Current effective mobilization status">
      <Chart options={options} series={series} type="donut" height={320} />
    </ComponentCard>
  );
}
