export type PaymentTerms = "15" | "30" | "45" | "60";

export interface Client {
  id: number;
  name: string;
  address?: string;
  contactPerson?: string;
  contactNumber?: string;
  email?: string;
  notes?: string;
  paymentTerms?: PaymentTerms;
  trn?: string;
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
  paymentTerms?: PaymentTerms;
  trn?: string;
}

export interface UpdateClientRequest extends Partial<CreateClientRequest> {}
