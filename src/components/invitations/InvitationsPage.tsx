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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            User Invitations
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage user invitations and role assignments
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mb-6">
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              + Send New Invitation
            </button>
          )}
        </div>

        {/* Invitation Form - Inline */}
        {showForm && (
          <div className="mb-8 flex justify-center">
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
