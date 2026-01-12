import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "../../services/api/dashboardApi";
import { AlertIcon, CalenderIcon, UserIcon } from "../../icons";

export default function ExpiringDocumentsCard() {
  const { data: employees, isLoading, error } = useQuery({
    queryKey: ["dashboard", "expiring-documents"],
    queryFn: dashboardApi.getExpiringDocuments,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  const getUrgencyColor = (days: number) => {
    if (days <= 3) return "text-red-600 dark:text-red-400";
    if (days <= 7) return "text-orange-600 dark:text-orange-400";
    return "text-yellow-600 dark:text-yellow-400";
  };

  const getUrgencyBadge = (days: number) => {
    if (days === 0) return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    if (days === 1) return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    if (days <= 3) return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    if (days <= 7) return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
    return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
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

  if (isLoading) {
    return (
      <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
          <AlertIcon className="h-5 w-5" />
          <p>Failed to load expiring documents data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="border-b border-stroke px-6 py-4 dark:border-strokedark">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-black dark:text-white">
            Document Expiry Alerts
          </h3>
          {employees && employees.length > 0 && (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-sm font-medium text-white">
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
            <p className="text-sm text-body dark:text-bodydark">
              No documents expiring in the next 15 days
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {employees.map((employee) => (
              <div
                key={employee.id}
                className="rounded-lg border border-stroke bg-gray-50 p-4 dark:border-strokedark dark:bg-meta-4"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-body dark:text-bodydark" />
                      <h4 className="font-semibold text-black dark:text-white">
                        {employee.name}
                      </h4>
                    </div>
                    <p className="text-sm text-body dark:text-bodydark">
                      Code: {employee.adaa_emp_code}
                    </p>
                    {employee.contact_no && (
                      <p className="mt-1 text-sm text-body dark:text-bodydark">
                        Contact: {employee.contact_no}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2.5">
                  {employee.expiringDocuments.map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-md border border-stroke bg-white p-3 dark:border-strokedark dark:bg-boxdark"
                    >
                      <div className="flex items-center gap-3">
                        <CalenderIcon className={`h-4 w-4 ${getUrgencyColor(doc.daysUntilExpiry)}`} />
                        <div>
                          <p className="font-medium text-black dark:text-white">
                            {doc.label}
                          </p>
                          <p className="text-sm text-body dark:text-bodydark">
                            Expires: {formatDate(doc.expiryDate)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${getUrgencyBadge(
                            doc.daysUntilExpiry
                          )}`}
                        >
                          {doc.daysUntilExpiry === 0
                            ? "Expires Today"
                            : doc.daysUntilExpiry === 1
                            ? "1 day"
                            : `${doc.daysUntilExpiry} days`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

