import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { payrollApi } from "../../services/api/payrollApi";
import { QUERY_KEYS } from "../../lib/constants";
import { downloadFile } from "../../utils/excelValidator";
import { Modal } from "../ui/ReusableModal";
import Button from "../ui/button/Button";
import { FileIcon, DownloadIcon, CloseIcon } from "../../icons";

interface AllowanceDeductionImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMonth: string;
}

interface ImportResult {
  success: boolean;
  message: string;
  updated: number;
  notFound: string[];
  errors: string[];
}

export default function AllowanceDeductionImportModal({
  isOpen,
  onClose,
  selectedMonth,
}: AllowanceDeductionImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: (file: File) =>
      payrollApi.importAllowancesDeductions(selectedMonth, file),
    onSuccess: (result) => {
      setImportResult(result);

      if (result.success && result.notFound.length === 0) {
        toast.success(
          `Successfully updated ${result.updated} payroll record(s)!`
        );
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.payroll.all });
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else if (result.success && result.notFound.length > 0) {
        toast.warning(
          `Updated ${result.updated} record(s). ${result.notFound.length} employee(s) not found.`
        );
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.payroll.all });
      } else {
        toast.error(`Import failed with ${result.errors.length} error(s).`);
      }
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message ||
          "Failed to import allowances/deductions"
      );
    },
  });

  const downloadTemplateMutation = useMutation({
    mutationFn: () => payrollApi.downloadAllowancesDeductionsTemplate(),
    onSuccess: (blob) => {
      downloadFile(blob, "allowances_deductions_template.xlsx");
      toast.success("Template downloaded successfully!");
    },
    onError: () => {
      toast.error("Failed to download template");
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportResult(null);

    // Basic file validation
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      toast.error("Please upload an Excel file (.xlsx or .xls)");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    toast.success("File selected successfully!");
  };

  const handleImport = () => {
    if (!selectedFile) return;
    importMutation.mutate(selectedFile);
  };

  const handleClose = () => {
    setSelectedFile(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  const handleDownloadTemplate = () => {
    downloadTemplateMutation.mutate();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Allowances & Deductions"
      size="lg"
    >
      <div className="p-6 space-y-6">
        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Import Instructions
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
            <li>Download the template file to see the required format</li>
            <li>
              <strong>Required columns:</strong> ID NO, Allowance, Allowance
              Value, Deduction, Deduction Value
            </li>
            <li>ID NO should match existing employee ADAA EMP CODE</li>
            <li>
              You can have multiple rows for the same employee (e.g., multiple
              allowances/deductions)
            </li>
            <li>Either Allowance or Deduction must have a value in each row</li>
            <li>Values must be positive numbers</li>
            <li>
              Import will update payroll records for the selected month:{" "}
              <strong>{selectedMonth}</strong>
            </li>
          </ul>
        </div>

        {/* Download Template Button */}
        <div>
          <Button
            onClick={handleDownloadTemplate}
            variant="outline"
            startIcon={<DownloadIcon />}
            disabled={downloadTemplateMutation.isPending}
            className="w-full"
          >
            {downloadTemplateMutation.isPending
              ? "Downloading..."
              : "Download Template"}
          </Button>
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Upload Excel File
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            disabled={importMutation.isPending}
            className="block w-full text-sm text-gray-900 dark:text-gray-100 
                     border border-gray-300 dark:border-gray-600 rounded-lg 
                     cursor-pointer bg-gray-50 dark:bg-gray-700
                     file:mr-4 file:py-2 file:px-4
                     file:rounded-lg file:border-0
                     file:text-sm file:font-semibold
                     file:bg-blue-50 file:text-blue-700
                     dark:file:bg-blue-900 dark:file:text-blue-200
                     hover:file:bg-blue-100 dark:hover:file:bg-blue-800"
          />
        </div>

        {/* Import Result */}
        {importResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                  Successfully Updated
                </p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {importResult.updated}
                </p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                  Not Found / Failed
                </p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                  {importResult.notFound.length + importResult.errors.length}
                </p>
              </div>
            </div>

            {/* Employees Not Found */}
            {importResult.notFound.length > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 max-h-40 overflow-y-auto">
                <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                  Employees Not Found
                </h4>
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="mb-1">
                    The following employee IDs were not found in the system:
                  </p>
                  <ul className="list-disc list-inside ml-2">
                    {importResult.notFound.map((empId, index) => (
                      <li key={index}>{empId}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Import Errors */}
            {importResult.errors.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 max-h-60 overflow-y-auto">
                <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2 flex items-center gap-2">
                  <CloseIcon className="w-5 h-5" />
                  Import Errors
                </h4>
                <ul className="text-sm text-red-800 dark:text-red-200 space-y-1 list-disc list-inside">
                  {importResult.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={handleClose}>
            {importResult &&
            importResult.notFound.length === 0 &&
            importResult.errors.length === 0
              ? "Close"
              : "Cancel"}
          </Button>
          {!importResult && (
            <Button
              onClick={handleImport}
              disabled={!selectedFile || importMutation.isPending}
              startIcon={<FileIcon />}
            >
              {importMutation.isPending
                ? "Importing..."
                : "Import Allowances & Deductions"}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

