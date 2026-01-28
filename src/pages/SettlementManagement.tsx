import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { settlementsApi } from "../services/api/settlementsApi";
import { QUERY_KEYS } from "../lib/constants";
import SettlementList from "../components/settlements/SettlementList";
import SettlementForm from "../components/settlements/SettlementForm";
import SettlementView from "../components/settlements/SettlementView";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import PermissionGuard from "../components/auth/PermissionGuard";
import { Modal } from "../components/ui/ReusableModal";
import { Settlement } from "../types/settlement";

export default function SettlementManagementPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingSettlement, setEditingSettlement] = useState<Settlement | null>(
    null
  );
  const [viewingSettlement, setViewingSettlement] = useState<Settlement | null>(
    null
  );

  const { data: settlementsData } = useQuery({
    queryKey: [...QUERY_KEYS.settlements.all, 1, 10],
    queryFn: () => settlementsApi.getSettlements(1, 10),
  });

  const handleCreateClick = () => {
    setEditingSettlement(null);
    setIsCreateModalOpen(true);
  };

  const handleEditClick = (settlement: Settlement) => {
    setEditingSettlement(settlement);
    setIsCreateModalOpen(true);
  };

  const handleViewClick = (settlement: Settlement) => {
    setViewingSettlement(settlement);
    setIsViewModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsCreateModalOpen(false);
    setEditingSettlement(null);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setViewingSettlement(null);
  };

  return (
    <>
      <PageMeta
        title="Settlement Management | ADAA Employment LLC"
        description="Manage employee final settlements and gratuity calculations for ADAA Employment LLC"
      />
      <PermissionGuard
        permission="settlement:read"
        fallback={
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Access Denied
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                You don't have permission to access settlement management.
              </p>
            </div>
          </div>
        }
      >
        <PageBreadcrumb pageTitle="Settlement Management" />

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <SettlementList
            onCreateSettlement={handleCreateClick}
            onEditSettlement={handleEditClick}
            onViewSettlement={handleViewClick}
            totalSettlements={settlementsData?.total || 0}
          />
        </div>

        {/* Create/Edit Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={handleCloseFormModal}
          title={
            editingSettlement
              ? "Edit Settlement"
              : "Create New Final Settlement"
          }
          size="4xl"
        >
          <div className="p-6 max-h-[80vh] overflow-y-auto">
            <SettlementForm
              settlement={editingSettlement || undefined}
              onClose={handleCloseFormModal}
            />
          </div>
        </Modal>

        {/* View/Print Modal */}
        <Modal
          isOpen={isViewModalOpen}
          onClose={handleCloseViewModal}
          title="Final Settlement Computation"
          size="4xl"
        >
          <div className="p-6 max-h-[90vh] overflow-y-auto">
            {viewingSettlement && (
              <SettlementView
                settlement={viewingSettlement}
                onClose={handleCloseViewModal}
              />
            )}
          </div>
        </Modal>
      </PermissionGuard>
    </>
  );
}
