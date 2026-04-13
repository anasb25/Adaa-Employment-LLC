import axiosInstance from "../../lib/axios";
import { Invoice, GenerateInvoiceRequest, UpdateInvoiceRequest, MarkAsPaidRequest } from "../../types/invoice";
import { API_BASE_URL } from "../../lib/constants";
import { PaginatedResponse } from "../../types/common";

export const invoicesApi = {
  getInvoices: async (params?: {
    projectId?: number;
    month?: string;
    status?: string;
    clientId?: number;
    invoiceNumber?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await axiosInstance.get<PaginatedResponse<Invoice>>(
      `${API_BASE_URL}/invoices`,
      { params }
    );
    return response.data;
  },

  getInvoiceById: async (id: number) => {
    const response = await axiosInstance.get<Invoice>(
      `${API_BASE_URL}/invoices/${id}`
    );
    return response.data;
  },

  generateInvoice: async (data: GenerateInvoiceRequest) => {
    const response = await axiosInstance.post<Invoice>(
      `${API_BASE_URL}/invoices/generate`,
      data
    );
    return response.data;
  },

  updateInvoice: async (id: number, data: UpdateInvoiceRequest) => {
    const response = await axiosInstance.patch<Invoice>(
      `${API_BASE_URL}/invoices/${id}`,
      data
    );
    return response.data;
  },

  approveInvoice: async (id: number) => {
    const response = await axiosInstance.post<Invoice>(
      `${API_BASE_URL}/invoices/${id}/approve`
    );
    return response.data;
  },

  markAsSent: async (id: number) => {
    const response = await axiosInstance.post<Invoice>(
      `${API_BASE_URL}/invoices/${id}/send`
    );
    return response.data;
  },

  markAsPaid: async (id: number, data: MarkAsPaidRequest) => {
    const response = await axiosInstance.post<Invoice>(
      `${API_BASE_URL}/invoices/${id}/paid`,
      data
    );
    return response.data;
  },

  deleteInvoice: async (id: number) => {
    await axiosInstance.delete(`${API_BASE_URL}/invoices/${id}`);
  },

  deleteMany: async (ids: number[]): Promise<{ deleted: number; skipped: number }> => {
    const response = await axiosInstance.post<{ deleted: number; skipped: number }>(
      `${API_BASE_URL}/invoices/actions/delete-many`,
      { ids }
    );
    return response.data;
  },

  downloadPdf: async (id: number) => {
    const response = await axiosInstance.get(
      `${API_BASE_URL}/invoices/${id}/pdf`,
      { responseType: "blob" }
    );
    return response.data;
  },
};

