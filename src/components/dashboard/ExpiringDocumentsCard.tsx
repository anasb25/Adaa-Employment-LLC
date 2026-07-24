import ExpiringDocumentsList from "./ExpiringDocumentsList";

export default function ExpiringDocumentsCard() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-800">
      <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Document Expiry Alerts
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Passport, visa, Emirates ID, and work permit expiring within 15 days
        </p>
      </div>
      <div className="p-6">
        <ExpiringDocumentsList />
      </div>
    </div>
  );
}
