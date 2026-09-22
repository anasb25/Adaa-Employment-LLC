import { useCallback, useRef, useState } from "react";
import { Settlement } from "../../types/settlement";
import { formatDecimalHours } from "../../utils/timeUtils";
import Button from "../ui/button/Button";
import { settlementsApi } from "../../services/api/settlementsApi";
import { toast } from "sonner";

interface SettlementViewProps {
  settlement: Settlement;
  onClose: () => void;
}

/** A4 page and inner padding (mm) — must match print CSS. */
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const A4_PADDING_X_MM = 4;
const A4_PADDING_Y_MM = 2;
const A4_CONTENT_WIDTH_MM = A4_WIDTH_MM - A4_PADDING_X_MM * 2;
const A4_CONTENT_HEIGHT_MM = A4_HEIGHT_MM - A4_PADDING_Y_MM * 2;
/** Slightly narrower than viewport so print scale can grow and fill page height. */
const PRINT_SHEET_WIDTH_MM = A4_CONTENT_WIDTH_MM * 0.88;
const MM_TO_PX = 96 / 25.4;

export default function SettlementView({
  settlement,
  onClose,
}: SettlementViewProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const fitSettlementToA4Page = useCallback((printRoot: HTMLDivElement) => {
    const sheet = printRoot.querySelector(
      ".settlement-print-sheet"
    ) as HTMLElement | null;
    const scaler = printRoot.querySelector(
      ".settlement-print-scaler"
    ) as HTMLElement | null;
    if (!sheet || !scaler) {
      return;
    }

    const viewWidthPx = A4_CONTENT_WIDTH_MM * MM_TO_PX;
    const viewHeightPx = A4_CONTENT_HEIGHT_MM * MM_TO_PX;

    scaler.style.transform = "none";
    const contentWidth = sheet.offsetWidth;
    const contentHeight = sheet.scrollHeight;

    const scaleW = viewWidthPx / contentWidth;
    const scaleH = viewHeightPx / contentHeight;
    let scale = Math.min(scaleW, scaleH);

    // Grow scale until height is filled or width would clip (reduces empty bottom).
    while (
      scale + 0.005 <= 1.45 &&
      contentHeight * (scale + 0.005) <= viewHeightPx &&
      contentWidth * (scale + 0.005) <= viewWidthPx
    ) {
      scale += 0.005;
    }

    const clamped = Math.max(0.35, scale);
    printRoot.style.setProperty("--settlement-print-scale", clamped.toFixed(4));
    scaler.style.transform = `scale(${clamped})`;

    sheet.style.display = "flex";
    sheet.style.flexDirection = "column";
    sheet.style.minHeight = `${viewHeightPx / clamped}px`;
    sheet.style.paddingBottom = "";
  }, []);

  /** Native OS print dialog — A4 page, content scaled to fit printable area. */
  const handlePrint = useCallback(() => {
    const printRoot = printRef.current;
    if (!printRoot) {
      toast.error("Content not available for printing");
      return;
    }

    const root = document.documentElement;

    const resetPrintLayout = () => {
      printRoot.style.removeProperty("--settlement-print-scale");
      const scaler = printRoot.querySelector(
        ".settlement-print-scaler"
      ) as HTMLElement | null;
      const sheet = printRoot.querySelector(
        ".settlement-print-sheet"
      ) as HTMLElement | null;
      if (scaler) {
        scaler.style.transform = "";
      }
      if (sheet) {
        sheet.style.paddingBottom = "";
        sheet.style.display = "";
        sheet.style.flexDirection = "";
        sheet.style.minHeight = "";
      }
    };

    const onBeforePrint = () => {
      fitSettlementToA4Page(printRoot);
    };

    const restore = () => {
      root.classList.remove("settlement-printing");
      resetPrintLayout();
      window.removeEventListener("beforeprint", onBeforePrint);
      window.removeEventListener("afterprint", restore);
    };

    resetPrintLayout();
    root.classList.add("settlement-printing");
    window.addEventListener("beforeprint", onBeforePrint);
    window.addEventListener("afterprint", restore);
    window.setTimeout(restore, 120_000);

    window.requestAnimationFrame(() => {
      fitSettlementToA4Page(printRoot);
      window.print();
    });
  }, [fitSettlementToA4Page]);

  const handleDownloadExcel = async () => {
    try {
      setIsDownloading(true);
      const blob = await settlementsApi.exportSettlementExcel(settlement.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Settlement-${settlement.empCode}-${settlement.id}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Excel file downloaded successfully");
    } catch (error) {
      console.error("Error downloading Excel:", error);
      toast.error("Failed to download Excel file");
    } finally {
      setIsDownloading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      {/* Download Controls */}
      <div className="flex justify-end gap-3 settlement-no-print">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button onClick={handlePrint} variant="primary">
          Print
        </Button>
        <Button 
          onClick={handleDownloadExcel} 
          disabled={isDownloading}
          variant="outline"
        >
          {isDownloading ? "Downloading..." : "Download Excel"}
        </Button>
      </div>

      {/* Settlement Document */}
      <div
        ref={printRef}
        className="settlement-a4-page bg-white text-black settlement-print-document"
        data-settlement-print-root
        data-pdf-root
      >
        <div className="settlement-print-viewport">
          <div className="settlement-print-scaler">
          <div className="settlement-print-sheet max-w-4xl mx-auto border-2 border-black p-8 print:border-2">
          {/* Header */}
          <div className="flex justify-between items-center border-b-4 border-black pb-4 mb-6">
            <h1 className="text-xl font-bold text-orange-600">
              Final Settlement Computation
            </h1>
            <div className="flex items-center">
              <img
                src="/images/logo/logo-icon.png"
                alt="ADAA Employment LLC Logo"
                width={60}
                height={60}
                className="block"
              />
            </div>
          </div>

          {/* Employee Information Grid - Two Column Layout */}
          <div
            className="grid grid-cols-2 gap-x-8 gap-y-3 mb-6 text-xs"
            data-pdf-section="employee-info"
          >
            {/* Left Column - Employee Details */}
            <div className="space-y-3">
              <div className="flex">
                <span className="font-bold min-w-[140px]">Emp Name:</span>
                <span className="flex-1 border-b border-black pl-2">
                  {settlement.empName}
                </span>
              </div>
              <div className="flex">
                <span className="font-bold min-w-[140px]">Emp Code:</span>
                <span className="flex-1 border-b border-black pl-2">
                  {settlement.empCode}
                </span>
              </div>
              <div className="flex">
                <span className="font-bold min-w-[140px]">Job Title:</span>
                <span className="flex-1 border-b border-black pl-2">
                  {settlement.jobTitle || "-"}
                </span>
              </div>
              <div className="flex">
                <span className="font-bold min-w-[140px]">Date of Join:</span>
                <span className="flex-1 border-b border-black pl-2">
                  {formatDate(settlement.dateOfJoin)}
                </span>
              </div>
              <div className="flex">
                <span className="font-bold min-w-[140px]">Last Date of Work:</span>
                <span className="flex-1 border-b border-black pl-2">
                  {formatDate(settlement.lastDateOfWork)}
                </span>
              </div>
              <div className="flex">
                <span className="font-bold min-w-[140px]">Last Total Salary:</span>
                <span className="flex-1 border-b border-black pl-2">
                  {settlement.lastTotalSalary} AED
                </span>
              </div>
              <div className="flex">
                <span className="font-bold min-w-[140px]">Total Days Absent:</span>
                <span className="flex-1 border-b border-black pl-2">
                  {settlement.totalDaysAbsent || "-"}
                </span>
              </div>
            </div>

            {/* Right Column - Salary and Service Information */}
            <div className="space-y-3">
              <div className="flex">
                <span className="font-bold min-w-[140px]">Basic Salary:</span>
                <span className="flex-1 border-b border-black pl-2">
                  {settlement.hourlySalary || "-"}
                </span>
              </div>
              <div className="flex">
                <span className="font-bold min-w-[140px]">HOURLY RATE:</span>
                <span className="flex-1 border-b border-black pl-2">
                  {settlement.hourlyRate || "-"}
                </span>
              </div>
              <div className="flex">
                <span className="font-bold min-w-[140px]">HRA Allowance:</span>
                <span className="flex-1 border-b border-black pl-2">
                  {settlement.allowance || "-"}
                </span>
              </div>
              <div className="flex">
                <span className="font-bold min-w-[140px]">Transport Allowance:</span>
                <span className="flex-1 border-b border-black pl-2">
                  {settlement.transportAllowance || "-"}
                </span>
              </div>
              <div className="flex">
                <span className="font-bold min-w-[140px]">Other Allowance:</span>
                <span className="flex-1 border-b border-black pl-2">
                  {settlement.otherAllowances || "-"}
                </span>
              </div>
              <div className="flex">
                <span className="font-bold min-w-[140px]">Total Years of Service:</span>
                <span className="flex-1 border-b border-black pl-2">
                  {settlement.totalYearsOfService || "-"}
                </span>
              </div>
              <div className="flex">
                <span className="font-bold min-w-[140px]">Annual Leave Days Bal:</span>
                <span className="flex-1 border-b border-black pl-2">
                  {settlement.annualLeaveBalance ? Number(settlement.annualLeaveBalance).toFixed(2) : "-"}
                </span>
              </div>
              <div className="flex">
                <span className="font-bold min-w-[140px]">Contract Type:</span>
                <span className="flex-1 border-b border-black pl-2">
                  {settlement.contractType || "-"}
                </span>
              </div>
            </div>
          </div>

          {/* Gratuity Eligibility */}
          <div className="border-2 border-black p-2 mb-6">
            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="flex items-center">
                <span>Eligible for Gratuity Pay?:</span>
                <span className="ml-4">
                  <span
                    className={`inline-block w-4 h-4 border-2 border-black mr-2 ${
                      settlement.eligibleForGratuity ? "bg-black" : ""
                    }`}
                  >
                    {settlement.eligibleForGratuity && (
                      <span className="text-white text-xs">✓</span>
                    )}
                  </span>
                  YES
                </span>
                <span className="ml-4">
                  <span
                    className={`inline-block w-4 h-4 border-2 border-black mr-2 ${
                      !settlement.eligibleForGratuity ? "bg-black" : ""
                    }`}
                  >
                    {!settlement.eligibleForGratuity && (
                      <span className="text-white text-xs">✓</span>
                    )}
                  </span>
                  NO
                </span>
              </div>
              {settlement.eligibleForGratuity && (
                <div className="flex items-center gap-2">
                  <span>IF YES, FOR HOW MANY DAYS PER YEAR OF SERVICE?</span>
                  <span className="border-b border-black px-4">
                    {settlement.gratuityDaysPerYear || 21}
                  </span>
                </div>
              )}
            </div>
            {settlement.gratuityReason && (
              <div className="mt-2 text-xs">
                <span className="font-bold">WHY?: </span>
                <span className="border-b border-black">
                  {settlement.gratuityReason}
                </span>
              </div>
            )}
          </div>

          {/* Payment Details Section */}
          <div
            className="text-center font-bold bg-gray-100 p-2 mb-2 text-xs border border-black"
            data-pdf-bg="gray"
          >
            PAYMENT DETAILS
          </div>

          <table className="w-full mb-4 text-xs">
            <thead>
              <tr>
                <th className="border border-black p-2 text-left">DESCRIPTION</th>
                <th className="border border-black p-2 text-right w-32">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {settlement.paymentItems.map((item, index) => {
                // Check if this is last month salary that should show "PAID"
                // Last month salary will have amount === 0 if paid, and won't have fromDate/toDate
                const isLastMonthSalary = item.description.includes("SALARY") && 
                  !item.fromDate && 
                  settlement.lastMonthSalaryPaid && 
                  item.amount === 0;
                
                // Check if this is current month salary (has fromDate/toDate)
                const isCurrentMonthSalary = item.description.includes("SALARY") && 
                  item.fromDate && 
                  item.toDate;
                
                // Format particular text
                let particularText = "";
                if (item.description === "GRATUITY" && item.forDays) {
                  particularText = `FOR ${item.forDays.toFixed(2)} DAYS OF SERVICE`;
                } else if (item.description === "LEAVE SALARY" && item.forDays) {
                  particularText = `BASIC × ${item.forDays.toFixed(2)} YEARS OF SERVICE`;
                } else if (isLastMonthSalary) {
                  particularText = "FOR 0 PAID";
                } else if (isCurrentMonthSalary) {
                  const fromDateStr = formatDate(item.fromDate);
                  const toDateStr = formatDate(item.toDate);
                  particularText = `FOR ${formatDecimalHours(item.forDays || 0)} Hours From ${fromDateStr} TO ${toDateStr}`;
                }
                
                return (
                  <tr key={index}>
                    <td className="border border-black p-2">
                      {item.description}
                      {particularText && (
                        <div className="text-gray-600 text-xs mt-1">
                          {particularText}
                        </div>
                      )}
                    </td>
                    <td className="border border-black p-2 text-right">
                      {isLastMonthSalary ? (
                        <span
                          className="bg-yellow-200 px-2 py-0.5 rounded"
                          data-pdf-bg="yellow-strong"
                        >
                          PAID
                        </span>
                      ) : (
                        Number(item.amount).toFixed(2)
                      )}
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-gray-100 font-bold" data-pdf-bg="gray">
                <td className="border border-black p-2">
                  TOTAL DUE:
                </td>
                <td className="border border-black p-2 text-right">
                  {Number(settlement.totalDue).toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Air Ticket - Show below payment table aligned with AMOUNT column */}
          {settlement.employee?.air_tickets && settlement.employee.air_tickets > 0 && (
            <div className="flex justify-end mb-4 text-xs">
              <table className="w-full">
                <tbody>
                  <tr>
                    <td className="p-2 text-left font-bold">AIR TICKET</td>
                    <td className="p-2 text-right w-32">{settlement.employee.air_tickets}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Deduction Details Section */}
          <div
            className="text-center font-bold bg-gray-100 p-2 mb-2 text-xs border border-black"
            data-pdf-bg="gray"
          >
            DEDUCTION DETAILS<br />
            PARTICULAR
          </div>

          <table className="w-full mb-4 text-xs">
            <thead>
              <tr>
                <th className="border border-black p-2 text-left">DESCRIPTION</th>
                <th className="border border-black p-2 text-right w-32">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {settlement.deductionItems.length > 0 ? (
                settlement.deductionItems.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-black p-2">{item.description}</td>
                    <td className="border border-black p-2 text-right">
                      {Number(item.amount).toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="border border-black p-2">No deductions</td>
                  <td className="border border-black p-2 text-right">0.00</td>
                </tr>
              )}
              <tr className="bg-gray-100 font-bold" data-pdf-bg="gray">
                <td className="border border-black p-2">TOTAL DEDUCTION:</td>
                <td className="border border-black p-2 text-right">
                  {Number(settlement.totalDeduction).toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Total Amount Due */}
          <div
            className="bg-yellow-100 border-2 border-black p-3 mb-6"
            data-pdf-bg="yellow"
          >
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm">
                TOTAL AMOUNT DUE FOR EOSB:
              </span>
              <span className="font-bold text-lg">
                AED {Number(settlement.finalAmount).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Signatures — margin-top auto in print spreads block to page bottom */}
          <div className="settlement-print-signatures grid grid-cols-3 gap-8 mb-6 text-xs">
            <div className="text-center">
              <div className="border-t-2 border-black mt-12 pt-2 font-bold">
                Prepared By:<br />
                HR Department
              </div>
            </div>
            <div className="text-center">
              <div className="border-t-2 border-black mt-12 pt-2 font-bold">
                Checked By:<br />
                Accounts Department
              </div>
            </div>
            <div className="text-center">
              <div className="border-t-2 border-black mt-12 pt-2 font-bold">
                Approved By:<br />
                Managing Director
              </div>
            </div>
          </div>

          {/* Acknowledgment Section */}
          <div className="border-2 border-black bg-blue-50" data-pdf-bg="blue">
            <div
              className="bg-green-600 text-white text-center p-2 font-bold text-sm"
              data-pdf-bg="green"
            >
              ACKNOWLEDGMENT AND QUIT CLAIM
            </div>
            <div className="p-4 text-xs leading-relaxed">
              <p className="mb-3">
                This is to acknowledge that I,{" "}
                <span className="font-bold border-b border-black">
                  {settlement.empName}
                </span>
                , passport holder{" "}
                <span className="font-bold border-b border-black">
                  {settlement.passportNo || "_____________"}
                </span>
                ,
              </p>
              <p className="mb-3">
                hereby agrees to the above as settlement of my final benefits
                as provided in the UAE Labour Law covering the period of my
                service with ADAA Employment LLC, Dubai. By accepting the full
                amount as my last payment, I quit/claim, release, and forever
                discharge the company and its successors, stakeholders,
                officers, and its employees from any and all liabilities
                arising from my employment.
              </p>
              <div className="grid grid-cols-2 gap-8 mt-8">
                <div>
                  <div className="font-bold mb-1">Signature:</div>
                  <div className="border-b-2 border-black h-8"></div>
                </div>
                <div>
                  <div className="font-bold mb-1">Date:</div>
                  <div className="border-b-2 border-black h-8"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-xs text-gray-600 italic mt-4">
            <p>Cc File & Accounts</p>
          </div>
          </div>
          </div>
        </div>
      </div>

      <style>{`
        html.settlement-printing .settlement-a4-page {
          width: ${A4_WIDTH_MM}mm;
          height: ${A4_HEIGHT_MM}mm;
          box-sizing: border-box;
          padding: ${A4_PADDING_Y_MM}mm ${A4_PADDING_X_MM}mm;
          margin: 0 auto;
          overflow: hidden;
          background: #fff;
        }

        html.settlement-printing .settlement-print-viewport {
          width: ${A4_CONTENT_WIDTH_MM}mm;
          height: ${A4_CONTENT_HEIGHT_MM}mm;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          overflow: hidden;
        }

        html.settlement-printing [data-settlement-print-root] {
          --settlement-print-scale: 1;
        }

        html.settlement-printing .settlement-print-scaler {
          transform: scale(var(--settlement-print-scale));
          transform-origin: top center;
        }

        html.settlement-printing .settlement-print-sheet {
          width: ${PRINT_SHEET_WIDTH_MM}mm;
          max-width: none !important;
          margin: 0 !important;
          padding: 2mm 2.5mm !important;
          box-sizing: border-box;
        }

        html.settlement-printing .settlement-print-signatures {
          margin-top: auto !important;
        }

        html.settlement-printing .settlement-print-sheet .mb-6 {
          margin-bottom: 0.35rem !important;
        }

        html.settlement-printing .settlement-print-sheet .mb-4 {
          margin-bottom: 0.25rem !important;
        }

        html.settlement-printing .settlement-print-sheet .mb-3 {
          margin-bottom: 0.2rem !important;
        }

        html.settlement-printing .settlement-print-sheet .mb-2 {
          margin-bottom: 0.15rem !important;
        }

        html.settlement-printing .settlement-print-sheet .mt-4 {
          margin-top: 0.25rem !important;
        }

        html.settlement-printing .settlement-print-sheet .mt-8 {
          margin-top: 0.35rem !important;
        }

        html.settlement-printing .settlement-print-sheet .mt-12 {
          margin-top: 0.75rem !important;
        }

        html.settlement-printing .settlement-print-sheet .pb-4 {
          padding-bottom: 0.25rem !important;
        }

        html.settlement-printing .settlement-print-sheet .p-2 {
          padding: 0.15rem 0.25rem !important;
        }

        html.settlement-printing .settlement-print-sheet .p-3 {
          padding: 0.25rem !important;
        }

        html.settlement-printing .settlement-print-sheet .p-4 {
          padding: 0.35rem !important;
        }

        html.settlement-printing .settlement-print-sheet .gap-8 {
          gap: 0.35rem !important;
        }

        html.settlement-printing .settlement-print-sheet .gap-y-3 {
          row-gap: 0.15rem !important;
        }

        html.settlement-printing .settlement-print-sheet .space-y-3 > * + * {
          margin-top: 0.15rem !important;
        }

        html.settlement-printing .settlement-print-sheet table th,
        html.settlement-printing .settlement-print-sheet table td {
          padding: 0.18rem 0.3rem !important;
          font-size: 10px !important;
          line-height: 1.2 !important;
        }

        html.settlement-printing .settlement-print-sheet .text-xs {
          font-size: 10px !important;
          line-height: 1.25 !important;
        }

        html.settlement-printing .settlement-print-sheet .text-sm {
          font-size: 11px !important;
          line-height: 1.25 !important;
        }

        html.settlement-printing .settlement-print-sheet .text-lg {
          font-size: 12px !important;
          line-height: 1.25 !important;
        }

        html.settlement-printing .settlement-print-sheet .text-xl {
          font-size: 14px !important;
          line-height: 1.25 !important;
        }

        html.settlement-printing .settlement-print-sheet img {
          width: 40px !important;
          height: 40px !important;
        }

        html.settlement-printing .settlement-print-sheet .h-8 {
          height: 1rem !important;
        }

        html.settlement-printing .settlement-print-sheet .leading-relaxed {
          line-height: 1.25 !important;
        }

        @media print {
          @page {
            size: ${A4_WIDTH_MM}mm ${A4_HEIGHT_MM}mm;
            margin: 0;
          }

          html.settlement-printing #root {
            display: none !important;
          }

          html.settlement-printing body {
            background: #fff !important;
            overflow: hidden !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          html.settlement-printing .settlement-a4-page {
            width: ${A4_WIDTH_MM}mm !important;
            height: ${A4_HEIGHT_MM}mm !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          html.settlement-printing .settlement-no-print {
            display: none !important;
          }

          html.settlement-printing .settlement-view-modal-body {
            padding: 0 !important;
            max-height: none !important;
            overflow: visible !important;
          }

          html.settlement-printing body > div.fixed {
            position: static !important;
            display: block !important;
            inset: auto !important;
            padding: 0 !important;
            background: transparent !important;
          }

          html.settlement-printing body > div.fixed > div.absolute {
            display: none !important;
          }

          html.settlement-printing body > div.fixed > div.relative {
            max-height: none !important;
            overflow: visible !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            width: ${A4_WIDTH_MM}mm !important;
            max-width: ${A4_WIDTH_MM}mm !important;
            background: #fff !important;
            margin: 0 auto !important;
          }

          html.settlement-printing body > div.fixed > div.relative > div:first-of-type {
            display: none !important;
          }

          html.settlement-printing body > div.fixed > div.relative > div.min-h-0 {
            overflow: visible !important;
            max-height: none !important;
          }

          html.settlement-printing [data-settlement-print-root],
          html.settlement-printing [data-settlement-print-root] * {
            color: #000 !important;
            border-color: #000 !important;
            box-shadow: none !important;
          }

          html.settlement-printing [data-settlement-print-root] {
            background-color: #fff !important;
          }

          html.settlement-printing [data-settlement-print-root] table th,
          html.settlement-printing [data-settlement-print-root] [data-pdf-bg="gray"] {
            background-color: #f0f0f0 !important;
          }

          html.settlement-printing [data-settlement-print-root] [data-pdf-bg="yellow"] {
            background-color: #fff3cd !important;
          }

          html.settlement-printing [data-settlement-print-root] [data-pdf-bg="yellow-strong"] {
            background-color: #facc15 !important;
          }

          html.settlement-printing [data-settlement-print-root] [data-pdf-bg="blue"] {
            background-color: #e0f2fe !important;
          }

          html.settlement-printing [data-settlement-print-root] [data-pdf-bg="green"] {
            background-color: #16a34a !important;
            color: #fff !important;
          }
        }
      `}</style>
    </div>
  );
}
