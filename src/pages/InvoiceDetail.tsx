import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { invoicesApi } from "../services/api/invoicesApi";
import { decimalToHM } from "../utils/timeUtils";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
import { ChevronLeftIcon, DownloadIcon } from "../icons";
import { InvoiceStatus } from "../types/invoice";

const STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  approved: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  sent: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: invoice, isLoading } = useQuery({
    queryKey: ["invoice", id],
    queryFn: () => invoicesApi.getInvoiceById(Number(id)),
    enabled: !!id,
  });

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    if (numAmount == null || isNaN(numAmount)) {
      return "AED 0.00";
    }
    return numAmount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDownloadPdf = async () => {
    try {
      const blob = await invoicesApi.downloadPdf(Number(id));
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Invoice-${invoice?.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download PDF:", error);
      toast.error("Failed to download PDF");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading invoice...</div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Invoice Not Found
          </h1>
          <Button onClick={() => navigate("/invoices")} startIcon={<AngleLeftIcon />}>
            Back to Invoices
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title={`Invoice ${invoice.invoiceNumber} | ADAA Employment LLC`}
        description="Invoice details"
      />

      <div className="no-print">
        <PageBreadcrumb pageTitle={`Invoice ${invoice.invoiceNumber}`} />
      </div>

      <div className="space-y-6">
        {/* Action Buttons */}
        <div className="no-print flex justify-between items-center rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <Button
            variant="outline"
            onClick={() => navigate("/invoices")}
            startIcon={<ChevronLeftIcon />}
          >
            Back to Invoices
          </Button>
          <div className="flex gap-3">
            <Button onClick={handleDownloadPdf} startIcon={<DownloadIcon />}>
              Download PDF
            </Button>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="invoice-print rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-white/[0.03]">
          {/* Header */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  INVOICE
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Invoice #: <span className="font-semibold text-gray-900 dark:text-white">{invoice.invoiceNumber}</span>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Date: <span className="font-semibold text-gray-900 dark:text-white">{formatDate(invoice.invoiceDate)}</span>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Due Date: <span className="font-semibold text-gray-900 dark:text-white">{formatDate(invoice.dueDate)}</span>
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${STATUS_COLORS[invoice.status]}`}
                >
                  {invoice.status.replace("_", " ").toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Company Details */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                FROM:
              </h3>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p className="font-semibold text-gray-900 dark:text-white">ADAA Employment LLC</p>
                <p>Dubai, U.A.E.</p>
                <p>TRN: 100200300400500</p>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                TO:
              </h3>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {invoice.project?.client?.name || "N/A"}
                </p>
                {invoice.project?.client?.address && (
                  <p>{invoice.project?.client?.address}</p>
                )}
                {invoice.project?.client?.trn && (
                  <p>TRN: {invoice.project?.client?.trn}</p>
                )}
              </div>
            </div>
          </div>

          {/* Subject */}
          {invoice.subject && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                SUBJECT:
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">{invoice.subject}</p>
            </div>
          )}

          {/* Project Details */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              PROJECT:
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {invoice.project?.name || "N/A"}
            </p>
          </div>

          {/* Line Items Table */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              DETAILS:
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Description
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Hours
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Rate/Hr
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Tax (5%)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {invoice.lineItems.map((item, idx) => (
                    <>
                      {/* Skill Header Row */}
                      <tr key={`skill-${idx}`} className="bg-gray-50 dark:bg-gray-800/30">
                        <td
                          colSpan={5}
                          className="px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white"
                        >
                          {item.skillName}
                        </td>
                      </tr>
                      {/* Rate Variant Rows */}
                      {item.rateVariants.map((variant, vIdx) => (
                        <tr key={`variant-${idx}-${vIdx}`}>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 pl-8">
                            {variant.variantName}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                            {decimalToHM(Number(variant.hours))}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                            {formatCurrency(variant.ratePerHour)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                            {formatCurrency(variant.amount)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                            {formatCurrency(variant.taxAmount)}
                          </td>
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-full max-w-sm space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Total Hours:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {decimalToHM(
                    invoice.lineItems.reduce(
                      (sum, item) =>
                        sum +
                        item.rateVariants.reduce(
                          (vs, v) => vs + Number(v.hours),
                          0
                        ),
                      0
                    )
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  AED {formatCurrency(invoice.totalTaxableAmount)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Tax (5%):</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  AED {formatCurrency(invoice.totalTax)}
                </span>
              </div>
              <div className="flex justify-between text-base pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="font-bold text-gray-900 dark:text-white">Total Amount:</span>
                <span className="font-bold text-gray-900 dark:text-white text-xl">
                  AED {formatCurrency(invoice.totalAmount)}
                </span>
              </div>
              {invoice.totalInWords && (
                <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                  {invoice.totalInWords}
                </div>
              )}
            </div>
          </div>

          {/* Payment Terms */}
          {invoice.project?.client?.paymentTerms && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                PAYMENT TERMS:
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Net {invoice.project.client.paymentTerms} days
              </p>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                NOTES:
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">{invoice.notes}</p>
            </div>
          )}

          {/* Payment Info */}
          {invoice.status === "paid" && invoice.paidDate && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-green-900 dark:text-green-300 mb-2">
                PAYMENT RECEIVED
              </h3>
              <p className="text-sm text-green-700 dark:text-green-400">
                Paid on: {formatDate(invoice.paidDate)}
              </p>
              {invoice.paymentReference && (
                <p className="text-sm text-green-700 dark:text-green-400">
                  Reference: {invoice.paymentReference}
                </p>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Thank you for your business!
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              For any queries, please contact us at ADAA Employment LLC
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .invoice-print {
            border: none !important;
            box-shadow: none !important;
          }
          body {
            background: white !important;
          }
        }
      `}</style>
    </>
  );
}

