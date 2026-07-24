import * as XLSX from "xlsx";

export interface ExcelValidationResult {
  isValid: boolean;
  errors: string[];
  data?: any[];
}

export const REQUIRED_HEADERS = [
  "ADAA EMP CODE",
  "NAME",
  "TRADE",
  "PP No",
  "DOJ",
  "DOB",
  "NATIONALITY",
  "PP EXPIRY",
  "VISA EXPIRY",
  "EID NO",
  "Emirates ID Expiry Date",
  "BASIC SALARY",
  "HRA",
  "OTHER ALLOWANCE",
  "RATE PER HR",
  "TOTAL SALARY",
  "CONTACT NO",
  "PERSONAL CODE",
  "WORK PERMIT",
  "WP EXPIRY",
  "SUPPLIER",
];

/**
 * Validates an Excel file for employee import
 * @param file The file to validate
 * @returns Promise with validation result
 */
export const validateEmployeeImportFile = async (
  file: File
): Promise<ExcelValidationResult> => {
  const errors: string[] = [];

  try {
    // Check file type
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      errors.push(
        "Invalid file type. Please upload an Excel file (.xlsx or .xls)"
      );
      return { isValid: false, errors };
    }

    // Read the file
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });

    // Check if a sheet containing "Master List" exists (case-insensitive, trimmed)
    const masterSheet = workbook.SheetNames.find((name) =>
      name.trim().toLowerCase().includes("master list")
    );

    if (!masterSheet) {
      const sheetsList = workbook.SheetNames.map((name) => `"${name}"`).join(
        ", "
      );
      errors.push(
        `Sheet containing "Master List" not found. Found sheets: ${sheetsList}. Please ensure your Excel file has a sheet with "Master List" in its name.`
      );
      return { isValid: false, errors };
    }

    // Get the Master List sheet
    const worksheet = workbook.Sheets[masterSheet];

    // Convert to JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    if (!rawData || rawData.length === 0) {
      errors.push('The "Master List" sheet is empty.');
      return { isValid: false, errors };
    }

    // Trim all header keys in the data
    const data = rawData.map((row: any) => {
      const trimmedRow: any = {};
      Object.keys(row).forEach((key) => {
        trimmedRow[key.trim()] = row[key];
      });
      return trimmedRow;
    });

    // Validate headers
    const firstRow = data[0] as any;
    const actualHeaders = Object.keys(firstRow);

    const missingHeaders = REQUIRED_HEADERS.filter(
      (header) => !actualHeaders.includes(header)
    );

    if (missingHeaders.length > 0) {
      errors.push(
        `Missing required columns: ${missingHeaders.join(
          ", "
        )}. Please ensure all required columns are present.`
      );
      return { isValid: false, errors };
    }

    // Basic validation of data
    const invalidRows: number[] = [];
    const missingSupplierRows: number[] = [];
    data.forEach((row: any, index: number) => {
      const rowNumber = index + 2;
      if (!row["ADAA EMP CODE"] || !row["NAME"]) {
        invalidRows.push(rowNumber);
      }
      if (!String(row["SUPPLIER"] ?? "").trim()) {
        missingSupplierRows.push(rowNumber);
      }
    });

    if (invalidRows.length > 0) {
      errors.push(
        `Rows ${invalidRows.join(
          ", ",
        )} are missing required fields (ADAA EMP CODE or NAME).`,
      );
      return { isValid: false, errors };
    }

    if (missingSupplierRows.length > 0) {
      errors.push(
        `Rows ${missingSupplierRows.join(", ")} are missing SUPPLIER.`,
      );
      return { isValid: false, errors };
    }

    return { isValid: true, errors: [], data };
  } catch (error) {
    errors.push(
      `Failed to parse Excel file: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
    return { isValid: false, errors };
  }
};

/**
 * Creates a template Excel file for employee import
 * @returns Blob containing the Excel template
 */
export const createEmployeeImportTemplate = (): Blob => {
  const templateData = [
    {
      "ADAA EMP CODE": "EMP001",
      NAME: "John Doe",
      TRADE: "Mason",
      "PP No": "A12345678",
      DOJ: "2024-01-15",
      DOB: "1990-01-01",
      NATIONALITY: "Indian",
      "PP EXPIRY": "2025-12-31",
      "VISA EXPIRY": "2025-06-30",
      "EID NO": "784-1990-1234567-1",
      "Emirates ID Expiry Date": "2025-12-31",
      "BASIC SALARY": "2000",
      HRA: "500",
      "OTHER ALLOWANCE": "300",
      "RATE PER HR": "25",
      "TOTAL SALARY": "2800",
      "CONTACT NO": "+971501234567",
      "PERSONAL CODE": "PC001",
      "WORK PERMIT": "WP123456",
      "WP EXPIRY": "2025-06-30",
      SUPPLIER: "ADAA",
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Master List");

  // Generate buffer
  const excelBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  return new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
};

/**
 * Downloads a file
 * @param blob The blob to download
 * @param filename The filename
 */
export const downloadFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
