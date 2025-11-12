export interface Client {
  id: number;
  name: string;
  address?: string;
  contactPerson?: string;
  contactNumber?: string;
  email?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientRequest {
  name: string;
  address?: string;
  contactPerson?: string;
  contactNumber?: string;
  email?: string;
  notes?: string;
}

export interface UpdateClientRequest extends Partial<CreateClientRequest> {}
