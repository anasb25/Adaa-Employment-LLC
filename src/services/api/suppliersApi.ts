import axiosInstance from "../../lib/axios";
import {
  CreateSupplierRequest,
  Supplier,
  UpdateSupplierRequest,
} from "../../types/supplier";

export const suppliersApi = {
  getAll: async (): Promise<Supplier[]> => {
    const res = await axiosInstance.get<Supplier[]>("/suppliers");
    return res.data;
  },

  getById: async (id: number): Promise<Supplier> => {
    const res = await axiosInstance.get<Supplier>(`/suppliers/${id}`);
    return res.data;
  },

  create: async (data: CreateSupplierRequest): Promise<Supplier> => {
    const res = await axiosInstance.post<Supplier>("/suppliers", data);
    return res.data;
  },

  update: async (id: number, data: UpdateSupplierRequest): Promise<Supplier> => {
    const res = await axiosInstance.put<Supplier>(`/suppliers/${id}`, data);
    return res.data;
  },

  remove: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/suppliers/${id}`);
  },
};
