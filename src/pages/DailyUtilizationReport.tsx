import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
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
  const reportRef = useRef<HTMLDivElement>(null);

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
    const element = reportRef.current;
    if (!element) {
      toast.error("Report content not available");
      return;
    }

    try {
      setIsDownloading(true);
      toast.loading("Generating PDF...");

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        onclone: (doc) => {
          const clonedElement = doc.querySelector("[data-pdf-root]");
          if (clonedElement) {
            // Force light colors for PDF
            const style = doc.createElement("style");
            style.innerHTML = `
              [data-pdf-root], [data-pdf-root] * {
                color: #000 !important;
                border-color: #9ca3af !important;
              }
              [data-pdf-root] .bg-yellow-100 {
                background-color: #fef3c7 !important;
              }
              [data-pdf-root] .bg-blue-100 {
                background-color: #dbeafe !important;
              }
              [data-pdf-root] .bg-green-100 {
                background-color: #d1fae5 !important;
              }
              [data-pdf-root] .bg-gray-100 {
                background-color: #f3f4f6 !important;
              }
            `;
            doc.head.appendChild(style);
          }
        },
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("l", "mm", "a4");
      const imgWidth = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= 210;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= 210;
      }

      pdf.save(`Daily_Utilization_Report_${selectedDate}.pdf`);
      toast.dismiss();
      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.dismiss();
      toast.error("Failed to generate PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <PageMeta title="Daily Utilization Report | ADAA Employment" />
      <PageBreadcrumb
        title="Daily Utilization Report"
        pages={[
          { name: "Dashboard", path: "/" },
          { name: "Daily Report", path: "/daily-report" },
        ]}
      />

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
          <div className="p-6" ref={reportRef} data-pdf-root>
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
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-900 bg-yellow-100 dark:border-gray-600 dark:bg-yellow-900">
                      <th className="border border-gray-400 px-4 py-3 text-left font-bold dark:border-gray-600 dark:text-white">
                        SR NO
                      </th>
                      <th className="border border-gray-400 px-4 py-3 text-left font-bold dark:border-gray-600 dark:text-white">
                        CLIENT NAME
                      </th>
                      <th className="border border-gray-400 px-4 py-3 text-left font-bold dark:border-gray-600 dark:text-white">
                        PROJECT NAME
                      </th>
                      <th className="border border-gray-400 px-4 py-3 text-left font-bold dark:border-gray-600 dark:text-white">
                        LOCATION
                      </th>
                      <th className="border border-gray-400 px-4 py-3 text-left font-bold dark:border-gray-600 dark:text-white">
                        FAT
                      </th>
                      <th className="border border-gray-400 px-4 py-3 text-left font-bold dark:border-gray-600 dark:text-white">
                        TRADE IN SITE
                      </th>
                      <th className="border border-gray-400 px-4 py-3 text-center font-bold dark:border-gray-600 dark:text-white">
                        HEAD COUNT
                      </th>
                      <th className="border border-gray-400 px-4 py-3 text-center font-bold dark:border-gray-600 dark:text-white">
                        TOTAL
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.clients.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="border border-gray-400 px-4 py-8 text-center text-gray-500 dark:border-gray-600 dark:text-gray-400"
                        >
                          No mobilized employees found for this date.
                        </td>
                      </tr>
                    ) : (
                      (() => {
                        let globalProjectIndex = 0;
                        return reportData.clients.map((client, clientIndex) => {
                          const clientRows: JSX.Element[] = [];
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
                                  key={`${client.clientId}-${project.projectId}-${trade.tradeInSite}`}
                                >
                                  {/* SR NO - show only on first row of client */}
                                  {isFirstRowOfClient && (
                                    <td
                                      className="border border-gray-400 px-4 py-2 text-center font-bold align-top dark:border-gray-600 dark:text-white"
                                      rowSpan={client.projects.reduce(
                                        (sum, p) => sum + p.trades.length,
                                        0,
                                      )}
                                    >
                                      {srNo}
                                    </td>
                                  )}

                                  {/* CLIENT NAME - show only on first row of client */}
                                  {isFirstRowOfClient && (
                                    <td
                                      className="border border-gray-400 px-4 py-2 font-semibold align-top dark:border-gray-600 dark:text-white"
                                      rowSpan={client.projects.reduce(
                                        (sum, p) => sum + p.trades.length,
                                        0,
                                      )}
                                    >
                                      {client.clientName.toUpperCase()}
                                    </td>
                                  )}

                                  {/* PROJECT NAME - show only on first row of project */}
                                  {isFirstRowOfProject && (
                                    <td
                                      className="border border-gray-400 px-4 py-2 align-top dark:border-gray-600 dark:text-white"
                                      rowSpan={project.trades.length}
                                    >
                                      {project.projectName.toUpperCase()}
                                    </td>
                                  )}

                                  {/* LOCATION - show only on first row of project */}
                                  {isFirstRowOfProject && (
                                    <td
                                      className="border border-gray-400 px-4 py-2 align-top dark:border-gray-600 dark:text-white"
                                      rowSpan={project.trades.length}
                                    >
                                      {project.location?.toUpperCase() || "-"}
                                    </td>
                                  )}

                                  {/* FAT - show only on first row of project */}
                                  {isFirstRowOfProject && (
                                    <td
                                      className="border border-gray-400 px-4 py-2 text-center align-top dark:border-gray-600 dark:text-white"
                                      rowSpan={project.trades.length}
                                    >
                                      {project.fat?.toUpperCase() || "-"}
                                    </td>
                                  )}

                                  {/* TRADE IN SITE */}
                                  <td className="border border-gray-400 px-4 py-2 dark:border-gray-600 dark:text-white">
                                    {trade.tradeInSite.toUpperCase()}
                                  </td>

                                  {/* HEAD COUNT */}
                                  <td
                                    className={`border border-gray-400 px-4 py-2 text-center font-semibold ${projectBgColor}`}
                                  >
                                    {trade.headCount}
                                  </td>

                                  {/* TOTAL - show only on first row of each project */}
                                  {isFirstRowOfProject && (
                                    <td
                                      className={`border border-gray-400 px-4 py-2 text-center font-bold align-middle ${projectBgColor}`}
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
                          colSpan={7}
                          className="border border-gray-400 px-4 py-3 text-right font-bold dark:border-gray-600 dark:text-white"
                        >
                          TOTAL MANPOWER
                        </td>
                        <td className="border border-gray-400 px-4 py-3 text-center font-bold text-lg dark:border-gray-600 dark:text-white">
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
