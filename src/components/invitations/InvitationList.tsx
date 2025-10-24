import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invitationApi } from "../../services/api/invitationApi";
import { Invitation, InvitationStatus } from "../../types/invitation";
import Button from "../ui/button/Button";
import Badge from "../ui/badge/Badge";
import { QUERY_KEYS } from "../../lib/constants";
import { toast } from "sonner";

interface InvitationListProps {
  refreshTrigger?: number;
}

const InvitationList: React.FC<InvitationListProps> = ({ refreshTrigger }) => {
  const queryClient = useQueryClient();

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

  const handleCancelInvitation = (invitationId: number) => {
    if (!window.confirm("Are you sure you want to cancel this invitation?")) {
      return;
    }
    cancelInvitationMutation.mutate(invitationId);
  };

  const handleResendInvitation = (invitationId: number) => {
    resendInvitationMutation.mutate(invitationId);
  };

  const getStatusBadge = (status: InvitationStatus) => {
    const statusConfig = {
      [InvitationStatus.PENDING]: { color: "yellow", text: "Pending" },
      [InvitationStatus.ACCEPTED]: { color: "green", text: "Accepted" },
      [InvitationStatus.EXPIRED]: { color: "red", text: "Expired" },
      [InvitationStatus.CANCELLED]: { color: "gray", text: "Cancelled" },
    };

    const config = statusConfig[status];
    return <Badge color={config.color as any}>{config.text}</Badge>;
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">
            Failed to load invitations
          </p>
          <Button onClick={() => refetch()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Sent Invitations
        </h2>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          Refresh
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
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {invitation.email}
                    </h3>
                    {getStatusBadge(invitation.status)}
                  </div>

                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <p>
                      <span className="font-medium">Role:</span>{" "}
                      {invitation.role.name}
                    </p>
                    <p>
                      <span className="font-medium">Sent:</span>{" "}
                      {formatDate(invitation.createdAt)}
                    </p>
                    <p>
                      <span className="font-medium">Expires:</span>{" "}
                      {formatDate(invitation.expiresAt)}
                      {isExpired(invitation.expiresAt) && (
                        <span className="text-red-500 ml-1">(Expired)</span>
                      )}
                    </p>
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
