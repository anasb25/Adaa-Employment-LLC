import { useState, type ReactElement } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { timesheetsApi } from "../services/api/timesheetsApi";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
import { CalenderIcon, DownloadIcon } from "../icons";
import { DailyUtilizationReport as DailyUtilizationReportType } from "../types/timesheet";

export default function DailyUtilizationReport() {
  // Default to today's date
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [isDownloading, setIsDownloading] = useState(false);

  const {
    data: reportData,
    isLoading,
    error,
  } = useQuery<DailyUtilizationReportType>({
    queryKey: ["dailyUtilizationReport", selectedDate],
    queryFn: () => timesheetsApi.getDailyUtilizationReport(selectedDate),
    enabled: !!selectedDate,
  });

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  const handlePreviousDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split("T")[0]);
  };

  const handleNextDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    setSelectedDate(date.toISOString().split("T")[0]);
  };

  const handleToday = () => {
    setSelectedDate(today);
  };

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDownloadExcel = () => {
    if (!reportData) return;

    try {
      const worksheetData: any[][] = [];

      // Add title and date
      worksheetData.push(["DAILY UTILIZATION REPORT"]);
      worksheetData.push([formatDisplayDate(selectedDate)]);
      worksheetData.push([]); // Empty row

      // Add headers
      worksheetData.push([
        "SR NO",
        "CLIENT NAME",
        "PROJECT NAME",
        "LOCATION",
        "FAT",
        "TRADE IN SITE",
        "SUPPLIER",
        "HEAD COUNT",
        "TOTAL",
      ]);

      // Add data rows
      reportData.clients.forEach((client, clientIndex) => {
        client.projects.forEach((project) => {
          project.trades.forEach((trade, tradeIndex) => {
            const row: any[] = [];

            // Add SR NO only for first trade of first project
            if (project === client.projects[0] && tradeIndex === 0) {
              row.push(clientIndex + 1);
            } else {
              row.push("");
            }

            // Add CLIENT NAME only for first trade of first project
            if (project === client.projects[0] && tradeIndex === 0) {
              row.push(client.clientName.toUpperCase());
            } else {
              row.push("");
            }

            // Add PROJECT NAME only for first trade
            if (tradeIndex === 0) {
              row.push(project.projectName.toUpperCase());
              row.push(project.location?.toUpperCase() || "-");
              row.push(project.fat?.toUpperCase() || "-");
            } else {
              row.push("");
              row.push("");
              row.push("");
            }

            // Add trade and head count
            row.push(trade.tradeInSite.toUpperCase());
            row.push(trade.supplier.toUpperCase());
            row.push(trade.headCount);

            // Add TOTAL only for first trade
            if (tradeIndex === 0) {
              const projectTotal = project.trades.reduce(
                (sum, t) => sum + t.headCount,
                0,
              );
              row.push(projectTotal);
            } else {
              row.push("");
            }

            worksheetData.push(row);
          });
        });
      });

      // Add total row
      worksheetData.push([]);
      worksheetData.push([
        "",
        "",
        "",
        "",
        "",
        "",
        "TOTAL MANPOWER",
        reportData.totalManpower,
        "",
      ]);

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Daily Utilization");

      XLSX.writeFile(workbook, `Daily_Utilization_Report_${selectedDate}.xlsx`);
      toast.success("Excel file downloaded successfully");
    } catch (error) {
      console.error("Error generating Excel:", error);
      toast.error("Failed to generate Excel file");
    }
  };

  const handleDownloadPDF = async () => {
    if (!reportData || reportData.clients.length === 0) {
      toast.error("No report data available");
      return;
    }

    let toastId: string | number | undefined;

    try {
      setIsDownloading(true);
      toastId = toast.loading("Generating PDF...");

      const pdf = new jsPDF("l", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();

      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("DAILY UTILIZATION REPORT", pageWidth / 2, 15, { align: "center" });
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(formatDisplayDate(selectedDate), pageWidth / 2, 22, { align: "center" });

      const headers = [["SR NO", "CLIENT NAME", "PROJECT NAME", "LOCATION", "FAT", "TRADE IN SITE", "SUPPLIER", "HEAD COUNT", "TOTAL"]];

      const body: any[][] = [];
      const merges: { row: number; col: number; rowSpan: number }[] = [];
      let rowIndex = 0;

      reportData.clients.forEach((client, clientIndex) => {
        const clientTotalRows = client.projects.reduce((sum, p) => sum + p.trades.length, 0);
        const clientStartRow = rowIndex;

        client.projects.forEach((project) => {
          const projectStartRow = rowIndex;

          project.trades.forEach((trade, tradeIndex) => {
            const projectTotal = project.trades.reduce((sum, t) => sum + t.headCount, 0);
            body.push([
              tradeIndex === 0 && project === client.projects[0] ? String(clientIndex + 1) : "",
              tradeIndex === 0 && project === client.projects[0] ? client.clientName.toUpperCase() : "",
              tradeIndex === 0 ? project.projectName.toUpperCase() : "",
              tradeIndex === 0 ? (project.location?.toUpperCase() || "-") : "",
              tradeIndex === 0 ? (project.fat?.toUpperCase() || "-") : "",
              trade.tradeInSite.toUpperCase(),
              trade.supplier.toUpperCase(),
              String(trade.headCount),
              tradeIndex === 0 ? String(projectTotal) : "",
            ]);
            rowIndex++;
          });

          if (project.trades.length > 1) {
            merges.push({ row: projectStartRow, col: 2, rowSpan: project.trades.length });
            merges.push({ row: projectStartRow, col: 3, rowSpan: project.trades.length });
            merges.push({ row: projectStartRow, col: 4, rowSpan: project.trades.length });
            merges.push({ row: projectStartRow, col: 8, rowSpan: project.trades.length });
          }
        });

        if (clientTotalRows > 1) {
          merges.push({ row: clientStartRow, col: 0, rowSpan: clientTotalRows });
          merges.push({ row: clientStartRow, col: 1, rowSpan: clientTotalRows });
        }
      });

      body.push([
        { content: "TOTAL MANPOWER", colSpan: 8, styles: { halign: "right", fontStyle: "bold", fillColor: [243, 244, 246] } },
        { content: String(reportData.totalManpower), styles: { halign: "center", fontStyle: "bold", fillColor: [243, 244, 246] } },
      ]);

      let projectColorIndex = 0;
      const rowToColor: Record<number, number[]> = {};
      let rIdx2 = 0;
      reportData.clients.forEach((client) => {
        client.projects.forEach((project) => {
          const color = projectColorIndex % 2 === 0 ? [219, 234, 254] : [209, 250, 229];
          project.trades.forEach(() => {
            rowToColor[rIdx2] = color;
            rIdx2++;
          });
          projectColorIndex++;
        });
      });

      autoTable(pdf, {
        startY: 28,
        head: headers,
        body,
        theme: "grid",
        styles: {
          fontSize: 8,
          cellPadding: 2,
          lineColor: [156, 163, 175],
          lineWidth: 0.3,
          valign: "top",
        },
        headStyles: {
          fillColor: [254, 243, 199],
          textColor: [0, 0, 0],
          fontStyle: "bold",
          halign: "left",
          fontSize: 8,
        },
        columnStyles: {
          0: { cellWidth: 12, halign: "center", fontStyle: "bold" },
          1: { cellWidth: 34, fontStyle: "bold" },
          2: { cellWidth: 48 },
          3: { cellWidth: 26 },
          4: { cellWidth: 18, halign: "center" },
          5: { cellWidth: 42 },
          6: { cellWidth: 34 },
          7: { cellWidth: 20, halign: "center", fontStyle: "bold" },
          8: { cellWidth: 18, halign: "center", fontStyle: "bold" },
        },
        didParseCell: (data) => {
          if (data.section !== "body") return;
          if (data.row.index >= body.length - 1) return;

          const color = rowToColor[data.row.index];
          if (color && (data.column.index === 7 || data.column.index === 8)) {
            data.cell.styles.fillColor = color as [number, number, number];
          }

          for (const m of merges) {
            if (data.column.index === m.col && data.row.index > m.row && data.row.index < m.row + m.rowSpan) {
              data.cell.text = [];
              data.cell.styles.lineWidth = { top: 0, right: 0.3, bottom: 0, left: 0.3 };
              data.cell.styles.fillColor = [255, 255, 255];
            }
            if (data.column.index === m.col && data.row.index === m.row) {
              data.cell.styles.lineWidth = { top: 0.3, right: 0.3, bottom: 0, left: 0.3 };
            }
            if (data.column.index === m.col && data.row.index === m.row + m.rowSpan - 1) {
              if (data.cell.text.length === 0 || (data.cell.text.length === 1 && data.cell.text[0] === "")) {
                data.cell.styles.lineWidth = { top: 0, right: 0.3, bottom: 0.3, left: 0.3 };
                data.cell.styles.fillColor = [255, 255, 255];
              }
            }
          }
        },
        margin: { left: 12, right: 12 },
      });

      pdf.save(`Daily_Utilization_Report_${selectedDate}.pdf`);
      toast.success("PDF downloaded successfully", { id: toastId });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF", { id: toastId });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Daily Utilization Report | ADAA Employment LLC"
        description="ADAA Employment LLC - Daily utilization report by client, project, trade, and supplier"
      />
      <PageBreadcrumb pageTitle="Daily Utilization Report" />

      <div className="space-y-6">
        {/* Date Selection Controls */}
        <div className="rounded-md bg-white px-6 py-4 shadow-sm dark:bg-gray-dark">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <CalenderIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select Date:
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePreviousDay}
                  className="px-3 py-2"
                >
                  ← Previous
                </Button>

                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleNextDay}
                  className="px-3 py-2"
                  disabled={selectedDate >= today}
                >
                  Next →
                </Button>

                <Button
                  type="button"
                  onClick={handleToday}
                  className="px-4 py-2"
                >
                  Today
                </Button>
              </div>
            </div>

            {/* Download Buttons */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleDownloadExcel}
                disabled={!reportData || isDownloading}
                className="flex items-center gap-2 px-4 py-2"
              >
                <DownloadIcon className="h-4 w-4" />
                Excel
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleDownloadPDF}
                disabled={!reportData || isDownloading}
                className="flex items-center gap-2 px-4 py-2"
              >
                <DownloadIcon className="h-4 w-4" />
                PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Report Card */}
        <div className="rounded-md bg-white shadow-sm dark:bg-gray-dark">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                DAILY UTILIZATION REPORT
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {formatDisplayDate(selectedDate)}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {isLoading && (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            )}

            {error && (
              <div className="rounded-md bg-red-50 p-4 text-center text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                Failed to load report data. Please try again.
              </div>
            )}

            {reportData && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs" style={{ tableLayout: "fixed" }}>
                  <colgroup>
                    <col style={{ width: "4%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "18%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "6%" }} />
                    <col style={{ width: "18%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "9%" }} />
                    <col style={{ width: "9%" }} />
                  </colgroup>
                  <thead>
                    <tr className="border-b-2 border-gray-900 bg-yellow-100 dark:border-gray-600 dark:bg-yellow-900">
                      <th className="border border-gray-400 px-2 py-2 text-left font-bold dark:border-gray-600 dark:text-white">
                        SR NO
                      </th>
                      <th className="border border-gray-400 px-2 py-2 text-left font-bold dark:border-gray-600 dark:text-white">
                        CLIENT NAME
                      </th>
                      <th className="border border-gray-400 px-2 py-2 text-left font-bold dark:border-gray-600 dark:text-white">
                        PROJECT NAME
                      </th>
                      <th className="border border-gray-400 px-2 py-2 text-left font-bold dark:border-gray-600 dark:text-white">
                        LOCATION
                      </th>
                      <th className="border border-gray-400 px-2 py-2 text-left font-bold dark:border-gray-600 dark:text-white">
                        FAT
                      </th>
                      <th className="border border-gray-400 px-2 py-2 text-left font-bold dark:border-gray-600 dark:text-white">
                        TRADE IN SITE
                      </th>
                      <th className="border border-gray-400 px-2 py-2 text-left font-bold dark:border-gray-600 dark:text-white">
                        SUPPLIER
                      </th>
                      <th className="border border-gray-400 px-2 py-2 text-center font-bold dark:border-gray-600 dark:text-white">
                        HEAD COUNT
                      </th>
                      <th className="border border-gray-400 px-2 py-2 text-center font-bold dark:border-gray-600 dark:text-white">
                        TOTAL
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.clients.length === 0 ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="border border-gray-400 px-2 py-6 text-center text-gray-500 dark:border-gray-600 dark:text-gray-400"
                        >
                          No mobilized employees found for this date.
                        </td>
                      </tr>
                    ) : (
                      (() => {
                        let globalProjectIndex = 0;
                        return reportData.clients.map((client, clientIndex) => {
                          const clientRows: ReactElement[] = [];
                          let srNo = clientIndex + 1;

                          client.projects.forEach((project, projectIndex) => {
                            // Determine background color for this project (alternating globally)
                            const projectBgColor =
                              globalProjectIndex % 2 === 0
                                ? "bg-blue-100 dark:bg-blue-900"
                                : "bg-green-100 dark:bg-green-900";
                            globalProjectIndex++;

                            project.trades.forEach((trade, tradeIndex) => {
                              const isFirstRowOfClient =
                                projectIndex === 0 && tradeIndex === 0;
                              const isFirstRowOfProject = tradeIndex === 0;

                              clientRows.push(
                                <tr
                                  key={`${client.clientId}-${project.projectId}-${trade.tradeInSite}-${trade.supplier}`}
                                >
                                  {isFirstRowOfClient && (
                                    <td
                                      className="border border-gray-400 px-2 py-1.5 text-center font-bold align-top dark:border-gray-600 dark:text-white"
                                      rowSpan={client.projects.reduce(
                                        (sum, p) => sum + p.trades.length,
                                        0,
                                      )}
                                    >
                                      {srNo}
                                    </td>
                                  )}

                                  {isFirstRowOfClient && (
                                    <td
                                      className="border border-gray-400 px-2 py-1.5 font-semibold align-top dark:border-gray-600 dark:text-white"
                                      rowSpan={client.projects.reduce(
                                        (sum, p) => sum + p.trades.length,
                                        0,
                                      )}
                                    >
                                      {client.clientName.toUpperCase()}
                                    </td>
                                  )}

                                  {isFirstRowOfProject && (
                                    <td
                                      className="border border-gray-400 px-2 py-1.5 align-top dark:border-gray-600 dark:text-white"
                                      rowSpan={project.trades.length}
                                    >
                                      {project.projectName.toUpperCase()}
                                    </td>
                                  )}

                                  {isFirstRowOfProject && (
                                    <td
                                      className="border border-gray-400 px-2 py-1.5 align-top dark:border-gray-600 dark:text-white"
                                      rowSpan={project.trades.length}
                                    >
                                      {project.location?.toUpperCase() || "-"}
                                    </td>
                                  )}

                                  {isFirstRowOfProject && (
                                    <td
                                      className="border border-gray-400 px-2 py-1.5 text-center align-top dark:border-gray-600 dark:text-white"
                                      rowSpan={project.trades.length}
                                    >
                                      {project.fat?.toUpperCase() || "-"}
                                    </td>
                                  )}

                                  <td className="border border-gray-400 px-2 py-1.5 dark:border-gray-600 dark:text-white">
                                    {trade.tradeInSite.toUpperCase()}
                                  </td>

                                  <td className="border border-gray-400 px-2 py-1.5 dark:border-gray-600 dark:text-white">
                                    {trade.supplier.toUpperCase()}
                                  </td>

                                  <td
                                    className={`border border-gray-400 px-2 py-1.5 text-center font-semibold ${projectBgColor}`}
                                  >
                                    {trade.headCount}
                                  </td>

                                  {isFirstRowOfProject && (
                                    <td
                                      className={`border border-gray-400 px-2 py-1.5 text-center font-bold align-middle ${projectBgColor}`}
                                      rowSpan={project.trades.length}
                                    >
                                      {project.trades.reduce(
                                        (sum, t) => sum + t.headCount,
                                        0,
                                      )}
                                    </td>
                                  )}
                                </tr>,
                              );
                            });
                          });

                          return clientRows;
                        });
                      })()
                    )}

                    {/* Total Manpower Row */}
                    {reportData.totalManpower > 0 && (
                      <tr className="bg-gray-100 dark:bg-gray-800">
                        <td
                          colSpan={8}
                          className="border border-gray-400 px-2 py-2 text-right font-bold dark:border-gray-600 dark:text-white"
                        >
                          TOTAL MANPOWER
                        </td>
                        <td className="border border-gray-400 px-2 py-2 text-center font-bold text-sm dark:border-gray-600 dark:text-white">
                          {reportData.totalManpower}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
