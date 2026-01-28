import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Settlement } from "../../types/settlement";
import Button from "../ui/button/Button";
import { settlementsApi } from "../../services/api/settlementsApi";
import { toast } from "sonner";

interface SettlementViewProps {
  settlement: Settlement;
  onClose: () => void;
}

export default function SettlementView({
  settlement,
  onClose,
}: SettlementViewProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    const element = printRef.current;
    if (!element) {
      toast.error("Content not available for PDF generation");
      return;
    }

    try {
      setIsDownloading(true);

      const images = Array.from(
        element.querySelectorAll("img")
      ) as HTMLImageElement[];
      await Promise.all(
        images.map((img) => {
          if (img.complete && img.naturalWidth !== 0) return Promise.resolve();
          return new Promise<void>((resolve) => {
            const onLoad = () => {
              cleanup();
              resolve();
            };
            const onError = () => {
              cleanup();
              resolve();
            };
            const cleanup = () => {
              img.removeEventListener("load", onLoad);
              img.removeEventListener("error", onError);
            };
            img.addEventListener("load", onLoad);
            img.addEventListener("error", onError);
          });
        })
      );

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        onclone: (doc) => {
          const style = doc.createElement("style");
          style.innerHTML = `
            [data-pdf-root], [data-pdf-root] * {
              color: #000 !important;
              border-color: #000 !important;
              background-color: transparent !important;
              box-shadow: none !important;
            }
            [data-pdf-root] {
              background-color: #fff !important;
            }
            [data-pdf-root] table th {
              background-color: #f0f0f0 !important;
            }
            [data-pdf-root] [data-pdf-bg="gray"] {
              background-color: #f0f0f0 !important;
            }
            [data-pdf-root] [data-pdf-bg="yellow"] {
              background-color: #fff3cd !important;
            }
            [data-pdf-root] [data-pdf-bg="yellow-strong"] {
              background-color: #facc15 !important;
            }
            [data-pdf-root] [data-pdf-bg="blue"] {
              background-color: #e0f2fe !important;
            }
            [data-pdf-root] [data-pdf-bg="green"] {
              background-color: #16a34a !important;
              color: #fff !important;
            }
            [data-pdf-root] .border-b {
              padding-bottom: 16px !important;
              border-bottom-width: 1px !important;
            }
            [data-pdf-root] [data-pdf-section="employee-info"] .flex {
              align-items: baseline !important;
            }
            [data-pdf-root] [data-pdf-section="employee-info"] .border-b {
              display: inline-block !important;
              width: 100% !important;
              line-height: 1.3 !important;
              min-height: 14px !important;
              padding-bottom: 4px !important;
              box-sizing: border-box !important;
            }
          `;
          doc.head.appendChild(style);
        },
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const margin = 10;
      const pageWidth = pdf.internal.pageSize.getWidth() - margin * 2;
      const pageHeight = pdf.internal.pageSize.getHeight() - margin * 2;
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        pdf.addPage();
        position = heightLeft - imgHeight + margin;
        pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Settlement-${settlement.empCode}-${settlement.id}.pdf`);
      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to generate PDF: ${errorMessage}`);
    } finally {
      setIsDownloading(false);
    }
  };

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
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button 
          onClick={handleDownloadPDF} 
          disabled={isDownloading}
          variant="primary"
        >
          {isDownloading ? "Downloading..." : "Download PDF"}
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
      <div ref={printRef} className="bg-white text-black" data-pdf-root>
        <div className="max-w-4xl mx-auto border-2 border-black p-8 print:border-2">
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
                  particularText = `FOR ${item.forDays.toFixed(2)} DAYS ANNUAL LEAVE BALANCE`;
                } else if (isLastMonthSalary) {
                  particularText = "FOR 0 PAID";
                } else if (isCurrentMonthSalary) {
                  const fromDateStr = formatDate(item.fromDate);
                  const toDateStr = formatDate(item.toDate);
                  particularText = `FOR ${item.forDays || 0} Hours From ${fromDateStr} TO ${toDateStr}`;
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

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-8 mb-6 text-xs">
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
  );
}
