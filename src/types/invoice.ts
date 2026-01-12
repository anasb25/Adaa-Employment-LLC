import { Project } from "./project";

export type InvoiceStatus = "draft" | "pending" | "approved" | "sent" | "paid" | "cancelled";

export interface RateVariantLineItem {
  variantName: string;
  hours: number;
  ratePerHour: number;
  taxPercentage: number;
  taxAmount: number;
  amount: number;
}

export interface InvoiceLineItem {
  skillName: string;
  skillId: number;
  rateVariants: RateVariantLineItem[];
  subtotal: number;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  projectId: number;
  project?: Project;
  month: string; // Format: YYYY-MM
  invoiceDate: string;
  dueDate: string;
  status: InvoiceStatus;
  subject?: string;
  notes?: string;
  lineItems: InvoiceLineItem[];
  totalTaxableAmount: number;
  totalTax: number;
  totalAmount: number;
  totalInWords?: string;
  paidDate?: string;
  paymentReference?: string;
  approvedDate?: string;
  approvedBy?: number;
  sentDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateInvoiceRequest {
  projectId: number;
  month: string; // Format: YYYY-MM
}

export interface UpdateInvoiceRequest {
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  subject?: string;
  notes?: string;
  status?: InvoiceStatus;
  paidDate?: string;
  paymentReference?: string;
}

export interface MarkAsPaidRequest {
  paidDate: string;
  paymentReference?: string;
}

