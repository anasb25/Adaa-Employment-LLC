import axiosInstance from "../../lib/axios";
import {
  CreateInvitationRequest,
  CreateInvitationResponse,
  Invitation,
  AcceptInvitationRequest,
  AcceptInvitationResponse,
} from "../../types/invitation";

export const invitationApi = {
  // Create a new invitation
  createInvitation: async (
    data: CreateInvitationRequest
  ): Promise<CreateInvitationResponse> => {
    const response = await axiosInstance.post<CreateInvitationResponse>(
      "/invitations",
      data
    );
    return response.data;
  },

  // Get all invitations sent by the current user
  getMyInvitations: async (): Promise<Invitation[]> => {
    const response = await axiosInstance.get<Invitation[]>(
      "/invitations/my-invitations"
    );
    return response.data;
  },

  // Accept an invitation
  acceptInvitation: async (
    data: AcceptInvitationRequest
  ): Promise<AcceptInvitationResponse> => {
    const response = await axiosInstance.post<AcceptInvitationResponse>(
      "/invitations/accept",
      data
    );
    return response.data;
  },

  // Validate an invitation token
  validateInvitation: async (token: string): Promise<Invitation> => {
    const response = await axiosInstance.get<Invitation>(
      `/invitations/validate/${token}`
    );
    return response.data;
  },

  // Cancel an invitation
  cancelInvitation: async (
    invitationId: number
  ): Promise<{ message: string }> => {
    const response = await axiosInstance.patch<{ message: string }>(
      `/invitations/${invitationId}/cancel`
    );
    return response.data;
  },

  // Resend an invitation
  resendInvitation: async (
    invitationId: number
  ): Promise<{ message: string }> => {
    const response = await axiosInstance.post<{ message: string }>(
      `/invitations/${invitationId}/resend`
    );
    return response.data;
  },
};
