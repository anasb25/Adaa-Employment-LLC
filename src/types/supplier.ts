export interface Supplier {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: number;
  updatedBy?: number;
}

export interface CreateSupplierRequest {
  name: string;
}

export interface UpdateSupplierRequest {
  name?: string;
}
