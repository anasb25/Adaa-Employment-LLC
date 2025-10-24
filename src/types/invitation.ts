// Invitation API Types

export interface CreateInvitationRequest {
  email: string;
  roleId: number;
}

export interface CreateInvitationResponse {
  id: number;
  email: string;
  role: {
    id: number;
    name: string;
    description: string;
  };
  status: InvitationStatus;
  expiresAt: string;
  inviter: {
    id: number;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

export interface Invitation {
  id: number;
  email: string;
  role: {
    id: number;
    name: string;
    description: string;
  };
  status: InvitationStatus;
  expiresAt: string;
  inviter: {
    id: number;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  acceptedAt?: string;
}

export enum InvitationStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  EXPIRED = "expired",
  CANCELLED = "cancelled",
}

export interface AcceptInvitationRequest {
  token: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface AcceptInvitationResponse {
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: {
      id: number;
      name: string;
      description: string;
    };
    isActive: boolean;
  };
  invitation: Invitation;
}
