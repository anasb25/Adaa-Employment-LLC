import React, { useState } from "react";
import InvitationForm from "./InvitationForm";
import InvitationList from "./InvitationList";

const InvitationsPage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleFormSuccess = () => {
    setShowForm(false);
    setRefreshTrigger((prev) => prev + 1); // Trigger refresh of the list
  };

  const handleFormCancel = () => {
    setShowForm(false);
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
      <div className="mb-5 flex items-center justify-start lg:mb-7">
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            + Send New Invitation
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Invitation Form - Inline */}
        {showForm && (
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              <InvitationForm
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
              />
            </div>
          </div>
        )}

        {/* Invitation List */}
        <InvitationList refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
};

export default InvitationsPage;
