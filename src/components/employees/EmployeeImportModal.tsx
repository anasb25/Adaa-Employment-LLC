import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { employeesApi, ImportResult } from "../../services/api/employeesApi";
import { QUERY_KEYS } from "../../lib/constants";
import {
  validateEmployeeImportFile,
  downloadFile,
} from "../../utils/excelValidator";
import { Modal } from "../ui/ReusableModal";
import Button from "../ui/button/Button";
import { FileIcon, DownloadIcon, CloseIcon } from "../../icons";

interface EmployeeImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EmployeeImportModal({
  isOpen,
  onClose,
}: EmployeeImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validating, setValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: (file: File) => employeesApi.importEmployees(file),
    onSuccess: (result) => {
      setImportResult(result);

      if (result.failed === 0) {
        toast.success(`Successfully imported ${result.success} employee(s)!`);
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.employees.all });
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        toast.warning(
          `Imported ${result.success} employee(s). ${result.failed} failed.`
        );
      }
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to import employees"
      );
    },
  });

  const downloadTemplateMutation = useMutation({
    mutationFn: () => employeesApi.downloadImportTemplate(),
    onSuccess: (blob) => {
      downloadFile(blob, "employee_import_template.xlsx");
      toast.success("Template downloaded successfully!");
    },
    onError: () => {
      toast.error("Failed to download template");
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setValidating(true);
    setValidationErrors([]);
    setImportResult(null);

    // Validate the file
    const validation = await validateEmployeeImportFile(file);

    setValidating(false);

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setSelectedFile(null);
      toast.error("Invalid file format");
    } else {
      setSelectedFile(file);
      setValidationErrors([]);
      toast.success("File validated successfully!");
    }
  };

  const handleImport = () => {
    if (!selectedFile) return;
    importMutation.mutate(selectedFile);
  };

  const handleClose = () => {
    setSelectedFile(null);
    setValidationErrors([]);
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
      title="Import Employees"
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
            <li>The Excel file must have a sheet containing "Master List"</li>
            <li>All columns shown in the template are required</li>
            <li>Date format should be YYYY-MM-DD (e.g., 2024-01-15)</li>
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
            disabled={validating || importMutation.isPending}
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

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2 flex items-center gap-2">
              <CloseIcon className="w-5 h-5" />
              Validation Errors
            </h4>
            <ul className="text-sm text-red-800 dark:text-red-200 space-y-1 list-disc list-inside">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Import Result */}
        {importResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                  Successfully Imported
                </p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {importResult.success}
                </p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                  Failed
                </p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                  {importResult.failed}
                </p>
              </div>
            </div>

            {/* Import Errors */}
            {importResult.errors.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 max-h-60 overflow-y-auto">
                <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                  Import Errors
                </h4>
                <div className="space-y-2">
                  {importResult.errors.map((error, index) => (
                    <div
                      key={index}
                      className="text-sm text-red-800 dark:text-red-200"
                    >
                      <strong>
                        Row {error.row} ({error.employee}):
                      </strong>
                      <ul className="list-disc list-inside ml-4">
                        {error.errors.map((err, errIdx) => (
                          <li key={errIdx}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={handleClose}>
            {importResult && importResult.failed === 0 ? "Close" : "Cancel"}
          </Button>
          {!importResult && (
            <Button
              onClick={handleImport}
              disabled={
                !selectedFile ||
                validating ||
                importMutation.isPending ||
                validationErrors.length > 0
              }
              startIcon={<FileIcon />}
            >
              {importMutation.isPending ? "Importing..." : "Import Employees"}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
