import React from "react";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "../../services/api/dashboardApi";
import { AlertIcon } from "../../icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";

export default function ExpiringDocumentsCard() {
  const { data: employees, isLoading, error } = useQuery({
    queryKey: ["dashboard", "expiring-documents"],
    queryFn: dashboardApi.getExpiringDocuments,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  const getUrgencyColor = (days: number) => {
    if (days < 0) return "text-red-700 dark:text-red-500";
    if (days === 0) return "text-red-600 dark:text-red-400";
    if (days <= 3) return "text-red-600 dark:text-red-400";
    if (days <= 7) return "text-orange-600 dark:text-orange-400";
    return "text-yellow-600 dark:text-yellow-400";
  };

  const getUrgencyBadge = (days: number) => {
    if (days < 0) return "bg-red-200 text-red-900 dark:bg-red-900/50 dark:text-red-200";
    if (days === 0) return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    if (days === 1) return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    if (days <= 3) return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    if (days <= 7) return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
    return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
  };

  const formatDaysBadge = (days: number) => {
    if (days < 0) {
      return `${Math.abs(days)} Days Expired`;
    }
    if (days === 0) {
      return "Expires Today";
    }
    if (days === 1) {
      return "1 Day";
    }
    return `${days} Days`;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  // Transform data into flat list and group by document type
  const getTableData = () => {
    if (!employees || employees.length === 0) return [];

    // Flatten all documents into rows
    const allRows: Array<{
      employeeId: number;
      name: string;
      adaa_emp_code: string;
      docType: string;
      expiryDate: string;
      daysUntilExpiry: number;
    }> = [];

    employees.forEach((employee) => {
      employee.expiringDocuments.forEach((doc) => {
        allRows.push({
          employeeId: employee.id,
          name: employee.name,
          adaa_emp_code: employee.adaa_emp_code,
          docType: doc.label,
          expiryDate: doc.expiryDate,
          daysUntilExpiry: doc.daysUntilExpiry,
        });
      });
    });

    // Group by document type
    const grouped = allRows.reduce((acc, row) => {
      if (!acc[row.docType]) {
        acc[row.docType] = [];
      }
      acc[row.docType].push(row);
      return acc;
    }, {} as Record<string, typeof allRows>);

    // Sort within each group by days (expired first, then by urgency)
    Object.keys(grouped).forEach((docType) => {
      grouped[docType].sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
    });

    // Define document type order
    const docTypeOrder = ['Passport', 'Emirates ID', 'Visa', 'Work Permit'];
    const orderedGroups = docTypeOrder
      .filter((type) => grouped[type])
      .map((type) => ({
        docType: type,
        rows: grouped[type],
      }));

    return orderedGroups;
  };

  const getStatusText = (days: number) => {
    if (days < 0) return "Expired";
    if (days === 0) return "Expires Today";
    if (days <= 3) return "Urgent";
    if (days <= 7) return "Warning";
    return "Expiring Soon";
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-gray-800 dark:bg-gray-800">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent dark:border-blue-400"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-gray-800 dark:bg-gray-800">
        <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
          <AlertIcon className="h-5 w-5" />
          <p className="dark:text-white">Failed to load expiring documents data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-gray-800 dark:bg-gray-800">
      <div className="border-b border-stroke px-6 py-4 dark:border-gray-700">
        <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-black dark:text-white">
                Document Expiry Alerts
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Expired or expiring within 15 days
              </p>
            </div>
          {employees && employees.length > 0 && (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-sm font-medium text-white dark:bg-red-600">
              {employees.length}
            </span>
          )}
        </div>
      </div>

      <div className="p-6">
        {!employees || employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <svg
                className="h-8 w-8 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h4 className="mb-2 text-lg font-semibold text-black dark:text-white">
              All Clear!
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No expired or expiring documents in the next 15 days
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <div className="max-w-full overflow-x-auto max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                  <TableRow>
                    <TableCell
                      isHeader
                      className="px-4 py-3 font-semibold text-gray-700 text-start text-sm dark:text-gray-300"
                    >
                      Name
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 font-semibold text-gray-700 text-start text-sm dark:text-gray-300"
                    >
                      ID
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 font-semibold text-gray-700 text-start text-sm dark:text-gray-300"
                    >
                      Document
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 font-semibold text-gray-700 text-start text-sm dark:text-gray-300"
                    >
                      Expiry Date
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 font-semibold text-gray-700 text-start text-sm dark:text-gray-300"
                    >
                      Days Left
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 font-semibold text-gray-700 text-start text-sm dark:text-gray-300"
                    >
                      Status
                    </TableCell>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {getTableData().map((group) => (
                    <React.Fragment key={group.docType}>
                      {/* Document Type Group Header */}
                      <TableRow className="bg-gray-100 dark:bg-gray-900/50">
                        <td
                          colSpan={6}
                          className="px-4 py-2 font-semibold text-gray-900 text-sm dark:text-white"
                        >
                          {group.docType}
                        </td>
                      </TableRow>
                      {/* Rows for this document type */}
                      {group.rows.map((row, idx) => (
                        <TableRow
                          key={`${row.employeeId}-${row.docType}-${idx}`}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                        >
                          <TableCell className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            {row.name}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {row.adaa_emp_code}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            {row.docType}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(row.expiryDate)}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${getUrgencyBadge(
                                row.daysUntilExpiry
                              )}`}
                            >
                              {formatDaysBadge(row.daysUntilExpiry)}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <span
                              className={`text-xs font-medium ${getUrgencyColor(row.daysUntilExpiry)}`}
                            >
                              {getStatusText(row.daysUntilExpiry)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

