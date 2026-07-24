import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invitationApi } from "../../services/api/invitationApi";
import { Invitation, InvitationStatus } from "../../types/invitation";
import Button from "../ui/button/Button";
import { QUERY_KEYS } from "../../lib/constants";
import { toast } from "sonner";
import { useConfirmDialog } from "../../providers/ConfirmDialogProvider";

interface InvitationListProps {
  refreshTrigger?: number;
}

const InvitationList: React.FC<InvitationListProps> = ({ refreshTrigger }) => {
  const queryClient = useQueryClient();
  const confirmDialog = useConfirmDialog();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);

  const {
    data: invitations = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.invitations.my,
    queryFn: () => invitationApi.getMyInvitations(),
    staleTime: 30 * 1000, // 30 seconds
    retry: 1,
  });

  // Cancel invitation mutation
  const cancelInvitationMutation = useMutation({
    mutationFn: (invitationId: number) =>
      invitationApi.cancelInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invitations.my });
      toast.success("Invitation cancelled successfully");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to cancel invitation"
      );
    },
  });

  // Resend invitation mutation
  const resendInvitationMutation = useMutation({
    mutationFn: (invitationId: number) =>
      invitationApi.resendInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invitations.my });
      toast.success("Invitation resent successfully");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to resend invitation"
      );
    },
  });

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      setRefreshSuccess(false);

      await refetch();

      // Show success feedback
      setRefreshSuccess(true);
      setTimeout(() => setRefreshSuccess(false), 2000); // Hide success state after 2 seconds
    } catch (error) {
      console.error("Failed to refresh invitations:", error);
      toast.error("Failed to refresh invitations");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCancelInvitation = async (invitationId: number) => {
    const confirmed = await confirmDialog({
      title: "Cancel Invitation",
      message: "Are you sure you want to cancel this invitation?",
      confirmText: "Cancel Invitation",
      variant: "warning",
    });
    if (!confirmed) {
      return;
    }
    cancelInvitationMutation.mutate(invitationId);
  };

  const handleResendInvitation = (invitationId: number) => {
    resendInvitationMutation.mutate(invitationId);
  };

  const getStatusBadge = (status: InvitationStatus) => {
    const statusConfig = {
      [InvitationStatus.PENDING]: {
        color: "blue" as const,
        text: "Pending",
        className:
          "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      },
      [InvitationStatus.ACCEPTED]: {
        color: "green" as const,
        text: "Accepted",
        className:
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      },
      [InvitationStatus.EXPIRED]: {
        color: "red" as const,
        text: "Expired",
        className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      },
      [InvitationStatus.CANCELLED]: {
        color: "gray" as const,
        text: "Cancelled",
        className:
          "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
      },
    };

    const config = statusConfig[status];
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
      >
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 bg-gray-200 dark:bg-gray-700 rounded"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400 mb-4">
          Failed to load invitations
        </p>
        <Button
          onClick={handleRefresh}
          variant="outline"
          disabled={isRefreshing}
        >
          {isRefreshing ? "Retrying..." : "Try Again"}
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end items-center mb-6">
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          disabled={isRefreshing}
          className={refreshSuccess ? "animate-pulse" : ""}
        >
          {isRefreshing ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Refreshing...
            </>
          ) : refreshSuccess ? (
            <>
              <svg
                className="w-4 h-4 mr-2 text-green-500"
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
              Refreshed!
            </>
          ) : (
            "Refresh"
          )}
        </Button>
      </div>

      {invitations.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            No invitations sent yet
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
            Use the invitation form to send your first invitation
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {invitations.map((invitation) => (
            <div
              key={invitation.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                      {invitation.email}
                    </h3>
                    {getStatusBadge(invitation.status)}
                  </div>

                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <p>
                      <span className="font-medium">Role:</span>{" "}
                      <span className="capitalize">{invitation.role.name}</span>
                    </p>
                    <p>
                      <span className="font-medium">Sent:</span>{" "}
                      {formatDate(invitation.createdAt)}
                    </p>
                    {/* Only show expiry date for non-accepted invitations */}
                    {invitation.status !== InvitationStatus.ACCEPTED && (
                      <p>
                        <span className="font-medium">Expires:</span>{" "}
                        {formatDate(invitation.expiresAt)}
                        {isExpired(invitation.expiresAt) && (
                          <span className="text-red-500 ml-1">(Expired)</span>
                        )}
                      </p>
                    )}
                    {invitation.acceptedAt && (
                      <p>
                        <span className="font-medium">Accepted:</span>{" "}
                        {formatDate(invitation.acceptedAt)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2 ml-4">
                  {invitation.status === InvitationStatus.PENDING && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResendInvitation(invitation.id)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Resend
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancelInvitation(invitation.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InvitationList;
