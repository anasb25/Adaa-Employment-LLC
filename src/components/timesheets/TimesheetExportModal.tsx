import { useState } from "react";
import { Modal } from "../ui/ReusableModal";
import Button from "../ui/button/Button";
import { MonthlyProjectTimesheetData } from "../../types/timesheet";
import { DownloadIcon, FileIcon } from "../../icons";
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  WidthType,
  BorderStyle,
  TextRun,
  AlignmentType,
  HeadingLevel,
} from "docx";
import { saveAs } from "file-saver";

interface TimesheetExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  timesheetData: MonthlyProjectTimesheetData;
  month: string;
  projectEdits: Map<string, number>;
  getHoursValue: (employeeId: number, dailyHour: any) => number;
}

export default function TimesheetExportModal({
  isOpen,
  onClose,
  timesheetData,
  month,
  projectEdits,
  getHoursValue,
}: TimesheetExportModalProps) {
  const [isExporting, setIsExporting] = useState(false);

  const getDaysInMonth = (monthStr: string) => {
    const [year, monthNum] = monthStr.split("-").map(Number);
    return new Date(year, monthNum, 0).getDate();
  };

  const daysInMonth = getDaysInMonth(month);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const [year, monthNum] = month.split("-");
  const monthName = new Date(
    parseInt(year),
    parseInt(monthNum) - 1,
    1
  ).toLocaleString("default", { month: "long" });

  // Calculate totals (rounded to whole numbers)
  const employeeTotals = timesheetData.employees.map((employee) => {
    return Math.round(
      employee.dailyHours.reduce((sum: number, dh: any) => {
        if (
          dh.jobStatus &&
          dh.jobStatus !== "demobilized" &&
          dh.jobStatus !== null
        ) {
          return sum + getHoursValue(employee.employeeId, dh);
        }
        return sum;
      }, 0)
    );
  });

  const dayTotals = days.map((day) => {
    return Math.round(
      timesheetData.employees.reduce((sum: number, employee: any) => {
        const dailyHour = employee.dailyHours.find((dh: any) => dh.day === day);
        if (
          dailyHour &&
          dailyHour.jobStatus &&
          dailyHour.jobStatus !== "demobilized" &&
          dailyHour.jobStatus !== null
        ) {
          return sum + getHoursValue(employee.employeeId, dailyHour);
        }
        return sum;
      }, 0)
    );
  });

  const grandTotal = Math.round(
    employeeTotals.reduce((sum, total) => sum + total, 0)
  );

  const handleExportPDF = () => {
    // Create a temporary container for the printable content
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const htmlContent = generatePrintHTML();

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  };

  const generatePrintHTML = () => {
    let tableRows = "";

    // Employee rows
    timesheetData.employees.forEach((employee: any, idx: number) => {
      let row = `<tr>
        <td style="text-align: center;">${employee.srNo}</td>
        <td style="text-align: center;">${employee.idNo}</td>
        <td style="text-align: left; padding-left: 4px;">${employee.name}</td>
        <td style="text-align: left; padding-left: 4px;">${employee.trade}</td>
        <td></td>`;

      days.forEach((day) => {
        const dailyHour = employee.dailyHours.find((dh: any) => dh.day === day);
        if (!dailyHour || dailyHour.jobStatus === null) {
          row += '<td style="text-align: center;">-</td>';
        } else if (dailyHour.jobStatus === "demobilized") {
          row += '<td style="text-align: center;">Dem</td>';
        } else {
          const hours = Math.round(
            getHoursValue(employee.employeeId, dailyHour)
          );
          let color = "#059669"; // Default green
          if (hours === 0) {
            color = "#dc2626"; // Red for zero
          } else if (dailyHour.jobStatus === "notice_period") {
            color = "#ea580c"; // Orange for notice period
          }
          row += `<td style="text-align: center; color: ${color}; font-weight: bold;">${hours}</td>`;
        }
      });

      row += `<td style="text-align: center; font-weight: bold;">${employeeTotals[idx]}</td></tr>`;
      tableRows += row;
    });

    // Total row
    let totalRow = `<tr style="background-color: #e0e0e0; font-weight: bold;">
      <td colspan="5" style="text-align: left; padding-left: 10px;">Total Hrs</td>`;

    dayTotals.forEach((total) => {
      totalRow += `<td style="text-align: center;">${
        total > 0 ? total : "-"
      }</td>`;
    });

    totalRow += `<td style="text-align: center; font-weight: bold; font-size: 10px;">${grandTotal}</td></tr>`;
    tableRows += totalRow;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Timesheet - ${
          timesheetData.project.name
        } - ${monthName} ${year}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
          
          body {
            font-family: Arial, sans-serif;
            font-size: 9px;
            color: #000;
            margin: 0;
            padding: 0;
          }
          
          .container {
            width: 100%;
            max-width: 277mm;
            margin: 0 auto;
          }
          
          .header {
            text-align: center;
            margin-bottom: 10px;
          }
          
          .header-logo {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          .header-company {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          
          .header-info {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            font-size: 10px;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
          }
          
          th, td {
            border: 1px solid #000;
            padding: 2px 4px;
            font-size: 8px;
          }
          
          th {
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: center;
          }
          
          .signatures {
            display: flex;
            justify-content: space-around;
            margin-top: 20px;
            gap: 20px;
          }
          
          .signature-box {
            flex: 1;
            text-align: center;
            border-top: 1px solid #000;
            padding-top: 5px;
            margin-top: 30px;
            font-size: 9px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-logo">ADAA</div>
            <div class="header-company">ADAA Employment LLC</div>
          </div>
          
          <div class="header-info">
            <div><strong>Site:</strong> ${timesheetData.project.name}</div>
            <div><strong>Client:</strong> ${
              timesheetData.project.client.name
            }</div>
            <div><strong>Period:</strong> ${monthName} ${year}</div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th style="width: 30px;">Sr.</th>
                <th style="width: 70px;">ID No</th>
                <th style="width: 120px;">Name</th>
                <th style="width: 80px;">Trade</th>
                <th style="width: 40px;">FAT</th>
                ${days
                  .map((day) => `<th style="width: 25px;">${day}</th>`)
                  .join("")}
                <th style="width: 50px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          
          <div class="signatures">
            <div class="signature-box">Prepared By</div>
            <div class="signature-box">Checked By</div>
            <div class="signature-box">Checked By</div>
            <div class="signature-box">Approved By</div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handleExportDOCX = async () => {
    setIsExporting(true);
    try {
      // Create table headers
      const headerCells = [
        new TableCell({
          children: [
            new Paragraph({ text: "Sr.", alignment: AlignmentType.CENTER }),
          ],
          width: { size: 5, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [
            new Paragraph({ text: "ID No", alignment: AlignmentType.CENTER }),
          ],
          width: { size: 8, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [
            new Paragraph({ text: "Name", alignment: AlignmentType.CENTER }),
          ],
          width: { size: 15, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [
            new Paragraph({ text: "Trade", alignment: AlignmentType.CENTER }),
          ],
          width: { size: 12, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [
            new Paragraph({ text: "FAT", alignment: AlignmentType.CENTER }),
          ],
          width: { size: 5, type: WidthType.PERCENTAGE },
        }),
      ];

      // Add day columns
      days.forEach((day) => {
        headerCells.push(
          new TableCell({
            children: [
              new Paragraph({
                text: day.toString(),
                alignment: AlignmentType.CENTER,
              }),
            ],
            width: {
              size: Math.floor(50 / daysInMonth),
              type: WidthType.PERCENTAGE,
            },
          })
        );
      });

      // Add Total column
      headerCells.push(
        new TableCell({
          children: [
            new Paragraph({ text: "Total", alignment: AlignmentType.CENTER }),
          ],
          width: { size: 5, type: WidthType.PERCENTAGE },
        })
      );

      // Create employee rows
      const employeeRows = timesheetData.employees.map(
        (employee: any, idx: number) => {
          const cells = [
            new TableCell({
              children: [
                new Paragraph({
                  text: employee.srNo.toString(),
                  alignment: AlignmentType.CENTER,
                }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  text: employee.idNo,
                  alignment: AlignmentType.CENTER,
                }),
              ],
            }),
            new TableCell({
              children: [new Paragraph({ text: employee.name })],
            }),
            new TableCell({
              children: [new Paragraph({ text: employee.trade })],
            }),
            new TableCell({ children: [new Paragraph({ text: "" })] }),
          ];

          // Add daily hours
          days.forEach((day) => {
            const dailyHour = employee.dailyHours.find(
              (dh: any) => dh.day === day
            );
            let cellText = "-";

            if (dailyHour) {
              if (dailyHour.jobStatus === "demobilized") {
                cellText = "Dem";
              } else if (dailyHour.jobStatus && dailyHour.jobStatus !== null) {
                const hours = Math.round(
                  getHoursValue(employee.employeeId, dailyHour)
                );
                cellText = hours.toString();
              }
            }

            cells.push(
              new TableCell({
                children: [
                  new Paragraph({
                    text: cellText,
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              })
            );
          });

          // Add total
          cells.push(
            new TableCell({
              children: [
                new Paragraph({
                  text: employeeTotals[idx].toString(),
                  alignment: AlignmentType.CENTER,
                  bold: true,
                }),
              ],
            })
          );

          return new TableRow({ children: cells });
        }
      );

      // Create total row
      const totalRowCells = [
        new TableCell({
          children: [new Paragraph({ text: "Total Hrs", bold: true })],
          columnSpan: 5,
        }),
      ];

      dayTotals.forEach((total) => {
        totalRowCells.push(
          new TableCell({
            children: [
              new Paragraph({
                text: total > 0 ? total.toString() : "-",
                alignment: AlignmentType.CENTER,
                bold: true,
              }),
            ],
          })
        );
      });

      totalRowCells.push(
        new TableCell({
          children: [
            new Paragraph({
              text: grandTotal.toString(),
              alignment: AlignmentType.CENTER,
              bold: true,
            }),
          ],
        })
      );

      const totalRow = new TableRow({ children: totalRowCells });

      // Create the table
      const table = new Table({
        rows: [
          new TableRow({ children: headerCells, tableHeader: true }),
          ...employeeRows,
          totalRow,
        ],
        width: { size: 100, type: WidthType.PERCENTAGE },
      });

      // Create the document
      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                margin: {
                  top: 720,
                  right: 720,
                  bottom: 720,
                  left: 720,
                },
                size: {
                  orientation: "landscape",
                  width: 11906,
                  height: 16838,
                },
              },
            },
            children: [
              new Paragraph({
                text: "ADAA",
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
              }),
              new Paragraph({
                text: "ADAA Employment LLC",
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Site: ", bold: true }),
                  new TextRun(timesheetData.project.name),
                  new TextRun({ text: "     Client: ", bold: true }),
                  new TextRun(timesheetData.project.client.name),
                  new TextRun({ text: "     Period: ", bold: true }),
                  new TextRun(`${monthName} ${year}`),
                ],
                spacing: { after: 200 },
              }),
              table,
              new Paragraph({
                text: "",
                spacing: { before: 400 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Prepared By _____________     ",
                    bold: true,
                  }),
                  new TextRun({
                    text: "Checked By _____________     ",
                    bold: true,
                  }),
                  new TextRun({
                    text: "Checked By _____________     ",
                    bold: true,
                  }),
                  new TextRun({
                    text: "Approved By _____________",
                    bold: true,
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          },
        ],
      });

      // Generate and save the document
      const blob = await Packer.toBlob(doc);
      saveAs(
        blob,
        `Timesheet_${timesheetData.project.name}_${monthName}_${year}.docx`
      );

      onClose();
    } catch (error) {
      console.error("Error generating DOCX:", error);
      alert("Failed to generate DOCX file. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export Timesheet" size="md">
      <div className="space-y-4 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Choose the format to export the timesheet for{" "}
          <strong>{timesheetData.project.name}</strong> - {monthName} {year}
        </p>

        <div className="space-y-3">
          <Button
            onClick={handleExportPDF}
            startIcon={<FileIcon />}
            variant="primary"
            className="w-full justify-center"
          >
            Export as PDF
          </Button>

          <Button
            onClick={handleExportDOCX}
            startIcon={<DownloadIcon />}
            variant="outline"
            className="w-full justify-center"
            disabled={isExporting}
          >
            {isExporting ? "Generating..." : "Export as DOCX"}
          </Button>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button onClick={onClose} variant="outline" className="w-full">
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
