import { useRef } from "react";
import { Settlement } from "../../types/settlement";
import Button from "../ui/button/Button";
import Logo from "../common/Logo";

interface SettlementViewProps {
  settlement: Settlement;
  onClose: () => void;
}

export default function SettlementView({
  settlement,
  onClose,
}: SettlementViewProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Final Settlement Computation - ${settlement.empCode}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              background: white;
            }
            .container {
              max-width: 800px;
              margin: 0 auto;
              border: 2px solid #000;
              padding: 20px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 3px solid #000;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .header h1 {
              color: #ff6600;
              font-size: 18px;
              font-weight: bold;
            }
            .logo {
              width: 60px;
              height: 60px;
              background: #003366;
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px 30px;
              margin-bottom: 20px;
            }
            .info-item {
              display: flex;
              font-size: 11px;
            }
            .info-label {
              font-weight: bold;
              min-width: 140px;
            }
            .info-value {
              flex: 1;
              border-bottom: 1px solid #000;
              padding-left: 10px;
            }
            .gratuity-section {
              border: 2px solid #000;
              padding: 8px;
              margin: 15px 0;
            }
            .gratuity-row {
              display: flex;
              align-items: center;
              gap: 10px;
              font-size: 11px;
              font-weight: bold;
            }
            .checkbox {
              width: 15px;
              height: 15px;
              border: 2px solid #000;
              display: inline-block;
              margin-right: 5px;
            }
            .checkbox.checked::after {
              content: '✓';
              display: block;
              text-align: center;
              line-height: 15px;
            }
            .section-title {
              text-align: center;
              font-weight: bold;
              background: #f0f0f0;
              padding: 8px;
              margin: 15px 0;
              font-size: 12px;
              border: 1px solid #000;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
              font-size: 11px;
            }
            table th, table td {
              border: 1px solid #000;
              padding: 6px;
              text-align: left;
            }
            table th {
              background: #f0f0f0;
              font-weight: bold;
            }
            .amount-col {
              text-align: right;
              width: 120px;
            }
            .total-row {
              background: #ffffcc;
              font-weight: bold;
              font-size: 13px;
            }
            .acknowledgment {
              border: 2px solid #000;
              padding: 15px;
              margin: 20px 0;
              background: #e8f4f8;
            }
            .acknowledgment-title {
              background: #00cc00;
              color: white;
              text-align: center;
              padding: 8px;
              font-weight: bold;
              margin: -15px -15px 15px -15px;
            }
            .acknowledgment-text {
              font-size: 10px;
              line-height: 1.6;
              margin-bottom: 15px;
            }
            .signature-section {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 20px;
              margin-top: 20px;
            }
            .signature-box {
              text-align: center;
            }
            .signature-line {
              border-top: 1px solid #000;
              margin-top: 40px;
              padding-top: 5px;
              font-size: 11px;
              font-weight: bold;
            }
            .date-box {
              margin-top: 20px;
            }
            .date-label {
              font-size: 11px;
              font-weight: bold;
            }
            .date-line {
              border-bottom: 1px solid #000;
              display: inline-block;
              min-width: 150px;
              margin-left: 10px;
            }
            .footer-note {
              font-size: 9px;
              font-style: italic;
              margin-top: 15px;
              color: #666;
            }
            @media print {
              @page {
                size: A4;
                margin: 10mm;
              }
              body {
                padding: 0;
                margin: 0;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .container {
                border: 2px solid #000;
                max-width: 100%;
                page-break-after: avoid;
              }
              * {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
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
      {/* Print Controls */}
      <div className="flex justify-end gap-3 print:hidden">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button onClick={handlePrint}>Print Settlement</Button>
      </div>

      {/* Settlement Document */}
      <div ref={printRef} className="bg-white text-black">
        <div className="max-w-4xl mx-auto border-2 border-black p-8 print:border-2">
          {/* Header */}
          <div className="flex justify-between items-center border-b-4 border-black pb-4 mb-6">
            <h1 className="text-xl font-bold text-orange-600">
              Final Settlement Computation
            </h1>
            <div className="w-16 h-16 bg-blue-900 rounded-lg flex items-center justify-center">
              <Logo />
            </div>
          </div>

          {/* Employee Information Grid - Two Column Layout */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-6 text-xs">
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
          <div className="text-center font-bold bg-gray-100 p-2 mb-2 text-xs border border-black">
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
                        <span className="bg-yellow-200 px-2 py-0.5 rounded">PAID</span>
                      ) : (
                        Number(item.amount).toFixed(2)
                      )}
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-gray-100 font-bold">
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
          <div className="text-center font-bold bg-gray-100 p-2 mb-2 text-xs border border-black">
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
              <tr className="bg-gray-100 font-bold">
                <td className="border border-black p-2">TOTAL DEDUCTION:</td>
                <td className="border border-black p-2 text-right">
                  {Number(settlement.totalDeduction).toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Total Amount Due */}
          <div className="bg-yellow-100 border-2 border-black p-3 mb-6">
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
          <div className="border-2 border-black bg-blue-50">
            <div className="bg-green-600 text-white text-center p-2 font-bold text-sm">
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
