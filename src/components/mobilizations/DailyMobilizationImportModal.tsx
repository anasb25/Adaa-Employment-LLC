import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { mobilizationsApi, ImportMobilizationResult } from "../../services/api/mobilizationsApi";
import { downloadFile } from "../../utils/excelValidator";
import { Modal } from "../ui/ReusableModal";
import Button from "../ui/button/Button";
import { FileIcon, DownloadIcon, ArrowUpIcon, AlertIcon } from "../../icons";

interface DailyMobilizationImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
}

export default function DailyMobilizationImportModal({
  isOpen,
  onClose,
  selectedDate,
}: DailyMobilizationImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportMobilizationResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: (file: File) => mobilizationsApi.importMobilizations(file),
    onSuccess: (result) => {
      setImportResult(result);

      if (result.failed === 0) {
        toast.success(`Successfully imported ${result.success} mobilization(s)!`);
        queryClient.invalidateQueries({ queryKey: ['mobilizations'] });
        queryClient.invalidateQueries({ queryKey: ['daily-mobilizations', selectedDate] });
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        toast.warning(
          `Imported ${result.success} mobilization(s). ${result.failed} failed.`
        );
      }
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to import mobilizations"
      );
    },
  });

  const downloadTemplateMutation = useMutation({
    mutationFn: () => mobilizationsApi.downloadImportTemplate(),
    onSuccess: (blob) => {
      downloadFile(blob, `mobilization_template_${selectedDate}.xlsx`);
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
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Please upload an Excel file (.xlsx or .xls)');
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

  const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Import Mobilizations - ${formattedDate}`}
      size="lg"
    >
      <div className="p-6 space-y-6">
        {/* Date Notice */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-1">
                Importing for {formattedDate}
              </h4>
              <p className="text-sm text-indigo-800 dark:text-indigo-200">
                Make sure the DATE column in your Excel file matches this date: <strong>{selectedDate}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Import Instructions
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
            <li>Download the template file to see the required format</li>
            <li>ID NO should match existing employee ADAA EMP CODE</li>
            <li>MOBILIZED TRADE will be created if it doesn't exist</li>
            <li>SITE and CLIENT will be created if they don't exist</li>
            <li>Date format should be YYYY-MM-DD (e.g., {selectedDate})</li>
            <li>MOB-DEM should be either "mobilized" or "demobilized"</li>
            <li>REASON maps to job status (On Job, On Vacation, Cancelled, Absconded)</li>
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
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-700 border-dashed rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
            <div className="space-y-1 text-center">
              <FileIcon className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600 dark:text-gray-400">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer rounded-md font-medium text-brand-600 hover:text-brand-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brand-500"
                >
                  <span>Upload a file</span>
                  <input
                    id="file-upload"
                    ref={fileInputRef}
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Excel files only (.xlsx, .xls)
              </p>
              {selectedFile && (
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Import Results */}
        {importResult && (
          <div className="space-y-3">
            <div className={`rounded-lg p-4 ${
              importResult.failed === 0
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
            }`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {importResult.failed === 0 ? (
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <AlertIcon className="h-5 w-5 text-yellow-400" />
                  )}
                </div>
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${
                    importResult.failed === 0
                      ? 'text-green-800 dark:text-green-200'
                      : 'text-yellow-800 dark:text-yellow-200'
                  }`}>
                    Import Summary
                  </h3>
                  <div className={`mt-2 text-sm ${
                    importResult.failed === 0
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-yellow-700 dark:text-yellow-300'
                  }`}>
                    <p>Successfully imported: {importResult.success}</p>
                    {importResult.failed > 0 && (
                      <p>Failed: {importResult.failed}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Error Details */}
            {importResult.errors && importResult.errors.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 max-h-60 overflow-y-auto">
                <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                  Import Errors
                </h4>
                <div className="space-y-2">
                  {importResult.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-700 dark:text-red-300">
                      <p className="font-medium">Row {error.row}: {error.employee}</p>
                      <ul className="list-disc list-inside ml-2">
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

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <Button
            onClick={handleClose}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!selectedFile || importMutation.isPending}
            startIcon={<ArrowUpIcon />}
          >
            {importMutation.isPending ? "Importing..." : "Import Mobilizations"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

