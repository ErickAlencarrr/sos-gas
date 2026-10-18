export type Role = "ADMIN" | "EMPLOYEE";
export type ProductType = "GAS" | "WATER" | "OTHERS";
export type ProductUnit = "UNIDADE" | "PACOTE" | "METRO" | "LITRO" | "KG";
export type TransactionType = "IN" | "OUT";
export type PaymentMethod = "PIX" | "CASH" | "CARD" | "CLIENT" | "SPLIT";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt?: string;
}

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  unit: ProductUnit;
  currentStock: number;
  emptyStock: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  balance: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Transaction {
  id: string;
  productId: string;
  product?: Product;
  customerId?: string | null;
  customer?: Customer | null;
  type: TransactionType;
  quantity: number;

  price?: number | null;
  paymentMethod?: PaymentMethod | null;

  cashPrice?: number | null;
  pixPrice?: number | null;
  cardPrice?: number | null;
  clientPrice?: number | null;

  returnedEmpty?: boolean | null;
  isPendingPickup: boolean;
  pickedUpAt?: string | null;

  invoiceNumber?: string | null;
  hasBoleto?: boolean | null;
  isBoletoPaid?: boolean | null;
  emptyQuantity?: number | null;

  dailyClosingId?: string | null;
  createdAt: string;
}

export interface Bill {
  id: string;
  title: string;
  amount?: number | null;
  dueDate: string;
  isPaid: boolean;
  isRecurring: boolean;
  transactionId?: string | null;
  transaction?: Transaction | null;
  createdAt?: string;
}

export interface DailyClosing {
  id: string;
  date: string;
  initialStock: number;
  finalStock: number;
  totalSales: number;
  totalRevenue: number;
  pixTotal: number;
  cashTotal: number;
  cardTotal: number;
  clientTotal: number;
  isClosed: boolean;
  transactions?: Transaction[];
  createdAt?: string;
}

export interface ClosingSummary {
  totalSales: number;
  totalRevenue: number;
  pixTotal: number;
  cashTotal: number;
  cardTotal: number;
  clientTotal: number;
  transactions: Transaction[];
}
