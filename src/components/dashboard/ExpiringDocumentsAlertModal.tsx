import { useQuery } from "@tanstack/react-query";
import { Modal } from "../ui/ReusableModal";
import Button from "../ui/button/Button";
import { AlertIcon } from "../../icons";
import { dashboardApi } from "../../services/api/dashboardApi";
import { QUERY_KEYS } from "../../lib/constants";
import ExpiringDocumentsList, {
  useExpiringDocumentsSummary,
} from "./ExpiringDocumentsList";

type ExpiringDocumentsAlertModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ExpiringDocumentsAlertModal({
  isOpen,
  onClose,
}: ExpiringDocumentsAlertModalProps) {
  const { data: employees } = useQuery({
    queryKey: QUERY_KEYS.dashboard.expiringDocuments,
    queryFn: dashboardApi.getExpiringDocuments,
    enabled: isOpen,
    refetchInterval: 5 * 60 * 1000,
  });

  const summary = useExpiringDocumentsSummary(employees);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Document Expiry Alerts"
      size="xl"
      className="border border-orange-200/60 dark:border-orange-900/40"
    >
      <div className="border-b border-gray-100 bg-gradient-to-r from-orange-50 via-amber-50 to-white px-6 py-5 dark:border-gray-800 dark:from-orange-950/30 dark:via-amber-950/20 dark:to-gray-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300">
              <AlertIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Action required
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {summary.employees} employee
                {summary.employees === 1 ? "" : "s"} with {summary.documents}{" "}
                document{summary.documents === 1 ? "" : "s"} expiring within 15
                days
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {summary.expired > 0 && (
              <span className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white">
                {summary.expired} expired
              </span>
            )}
            {summary.urgent > 0 && (
              <span className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white">
                {summary.urgent} urgent
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        <ExpiringDocumentsList
          maxTableHeight="min(420px, 50vh)"
          showViewAllLink
        />
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-900/40">
        <Button variant="outline" onClick={onClose}>
          Dismiss
        </Button>
        <Button onClick={onClose}>Got it</Button>
      </div>
    </Modal>
  );
}
