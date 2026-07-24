import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import ComponentCard from "../common/ComponentCard";

type InvoiceStatusChartProps = {
  draft: number;
  pending: number;
  approved: number;
  sent: number;
  paid: number;
  cancelled: number;
  month: string;
};

export default function InvoiceStatusChart({
  draft,
  pending,
  approved,
  sent,
  paid,
  cancelled,
  month,
}: InvoiceStatusChartProps) {
  const series = [draft, pending, approved, sent, paid, cancelled];
  const labels = ["Draft", "Pending", "Approved", "Sent", "Paid", "Cancelled"];

  const options: ApexOptions = {
    chart: { type: "donut", fontFamily: "Outfit, sans-serif" },
    labels,
    colors: ["#94a3b8", "#f59e0b", "#3b82f6", "#8b5cf6", "#10b981", "#ef4444"],
    legend: { position: "bottom" },
    dataLabels: { enabled: true },
    plotOptions: {
      pie: { donut: { size: "65%" } },
    },
    stroke: { width: 0 },
  };

  const total = series.reduce((sum, val) => sum + val, 0);

  return (
    <ComponentCard title="Invoice Status" desc={`Invoices for ${month}`}>
      {total === 0 ? (
        <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
          No invoices for this month
        </p>
      ) : (
        <Chart options={options} series={series} type="donut" height={300} />
      )}
    </ComponentCard>
  );
}
