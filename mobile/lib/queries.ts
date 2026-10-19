import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./api";
import {
  Product,
  Customer,
  Transaction,
  ClosingSummary,
  DailyClosing,
  Bill,
  User,
  ProductType,
  ProductUnit,
  Role,
} from "../types";

// ---------- Dashboard ----------

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: () => apiFetch<Product[]>("/api/products"),
  });
}

export function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: () => apiFetch<Customer[]>("/api/customers"),
  });
}

export function useClosingSummary() {
  return useQuery({
    queryKey: ["closing-summary"],
    queryFn: () => apiFetch<ClosingSummary>("/api/closing/summary"),
  });
}

export function usePendingPickups() {
  return useQuery({
    queryKey: ["pending-pickups"],
    queryFn: () => apiFetch<Transaction[]>("/api/transactions/pending-pickups"),
  });
}

export function useTodaySales() {
  return useQuery({
    queryKey: ["today-sales"],
    queryFn: () => apiFetch<Transaction[]>("/api/transactions/today"),
  });
}

function useInvalidate(keys: string[]) {
  const queryClient = useQueryClient();
  return () => keys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
}

function useInvalidateDashboard() {
  return useInvalidate(["products", "closing-summary", "pending-pickups", "today-sales", "customers"]);
}

export type SellPayload = {
  productId: string;
  type: "OUT";
  quantity: number;
  price: number;
  paymentMethod: "PIX" | "CASH" | "CARD" | "CLIENT" | "SPLIT";
  customerId?: string;
  splitValues?: { cash: string; pix: string; card: string; client: string };
  returnedEmpty: boolean;
  isPendingPickup: boolean;
};

export function useCreateSale() {
  const invalidate = useInvalidateDashboard();
  return useMutation({
    mutationFn: (payload: SellPayload) => apiFetch<Transaction>("/api/transactions", { method: "POST", body: payload }),
    onSuccess: invalidate,
  });
}

export function useConfirmPickup() {
  const invalidate = useInvalidateDashboard();
  return useMutation({
    mutationFn: (id: string) => apiFetch<Transaction>(`/api/transactions/${id}/pickup`, { method: "PATCH" }),
    onSuccess: invalidate,
  });
}

export function useDeleteSale() {
  const invalidate = useInvalidateDashboard();
  return useMutation({
    mutationFn: (id: string) => apiFetch<{ success: true }>(`/api/transactions/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}

export function useCloseRegister() {
  const invalidate = useInvalidate(["products", "closing-summary", "pending-pickups", "today-sales", "customers", "closings"]);
  return useMutation({
    mutationFn: () => apiFetch<DailyClosing>("/api/closing", { method: "POST" }),
    onSuccess: invalidate,
  });
}

// ---------- Produtos ----------

export type ProductPayload = {
  name: string;
  type: ProductType;
  unit: ProductUnit;
  currentStock: number;
  emptyStock: number;
};

export function useCreateProduct() {
  const invalidate = useInvalidate(["products"]);
  return useMutation({
    mutationFn: (payload: ProductPayload) => apiFetch<Product>("/api/products", { method: "POST", body: payload }),
    onSuccess: invalidate,
  });
}

export function useUpdateProduct() {
  const invalidate = useInvalidate(["products"]);
  return useMutation({
    mutationFn: ({ id, ...payload }: ProductPayload & { id: string }) =>
      apiFetch<Product>(`/api/products/${id}`, { method: "PUT", body: payload }),
    onSuccess: invalidate,
  });
}

export function useDeleteProduct() {
  const invalidate = useInvalidate(["products"]);
  return useMutation({
    mutationFn: (id: string) => apiFetch<{ success: true }>(`/api/products/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}

// ---------- Inventário (entrada de carga) ----------

export type ReceiveStockPayload = {
  productId: string;
  type: "IN";
  quantity: number;
  emptyQuantity: number;
  invoiceNumber?: string;
  hasBoleto?: boolean;
  isBoletoPaid?: boolean;
  boletoAmount?: string;
  boletoDueDate?: string;
};

export function useReceiveStock() {
  const invalidate = useInvalidate(["products", "bills"]);
  return useMutation({
    mutationFn: (payload: ReceiveStockPayload) => apiFetch<Transaction>("/api/transactions", { method: "POST", body: payload }),
    onSuccess: invalidate,
  });
}

// ---------- Clientes ----------

export function useCustomerHistory(customerId: string | null) {
  return useQuery({
    queryKey: ["customer-history", customerId],
    queryFn: () => apiFetch<Transaction[]>(`/api/customers/${customerId}/history`),
    enabled: !!customerId,
  });
}

export function useCreateCustomer() {
  const invalidate = useInvalidate(["customers"]);
  return useMutation({
    mutationFn: (name: string) => apiFetch<Customer>("/api/customers", { method: "POST", body: { name } }),
    onSuccess: invalidate,
  });
}

export function useUpdateCustomer() {
  const invalidate = useInvalidate(["customers"]);
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      apiFetch<Customer>(`/api/customers/${id}`, { method: "PUT", body: { name } }),
    onSuccess: invalidate,
  });
}

export function useDeleteCustomer() {
  const invalidate = useInvalidate(["customers"]);
  return useMutation({
    mutationFn: (id: string) => apiFetch<{ message: string }>(`/api/customers/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}

export function usePayCustomerDebt() {
  const invalidate = useInvalidate(["customers"]);
  return useMutation({
    mutationFn: ({ customerId, amount }: { customerId: string; amount: number }) =>
      apiFetch<Customer>("/api/customers/pay", { method: "POST", body: { customerId, amount } }),
    onSuccess: invalidate,
  });
}

// ---------- Contas (Bills) ----------

export function useBills() {
  return useQuery({
    queryKey: ["bills"],
    queryFn: () => apiFetch<Bill[]>("/api/bills"),
  });
}

export type BillPayload = {
  title: string;
  amount?: string;
  dueDate: string;
  isPaid: boolean;
  isRecurring: boolean;
};

export function useCreateBill() {
  const invalidate = useInvalidate(["bills"]);
  return useMutation({
    mutationFn: (payload: BillPayload) => apiFetch<Bill>("/api/bills", { method: "POST", body: payload }),
    onSuccess: invalidate,
  });
}

export function useToggleBillPaid() {
  const invalidate = useInvalidate(["bills"]);
  return useMutation({
    mutationFn: ({ id, isPaid }: { id: string; isPaid: boolean }) =>
      apiFetch<Bill>(`/api/bills/${id}`, { method: "PUT", body: { isPaid } }),
    onSuccess: invalidate,
  });
}

export function useDeleteBill() {
  const invalidate = useInvalidate(["bills"]);
  return useMutation({
    mutationFn: (id: string) => apiFetch<{ success: true }>(`/api/bills/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}

// ---------- Relatórios / Fechamentos ----------

export function useClosings() {
  return useQuery({
    queryKey: ["closings"],
    queryFn: () => apiFetch<DailyClosing[]>("/api/closing"),
  });
}

export function useClosingDetail(id: string | null) {
  return useQuery({
    queryKey: ["closing-detail", id],
    queryFn: () => apiFetch<DailyClosing>(`/api/closing/${id}`),
    enabled: !!id,
  });
}

export function useFixOrphaned() {
  const invalidate = useInvalidate(["closings"]);
  return useMutation({
    mutationFn: () => apiFetch<{ created: number }>("/api/admin/fix-orphaned", { method: "POST" }),
    onSuccess: invalidate,
  });
}

// ---------- Usuários ----------

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => apiFetch<User[]>("/api/users"),
  });
}

export type UserPayload = {
  name: string;
  email: string;
  password?: string;
  role: Role;
};

export function useCreateUser() {
  const invalidate = useInvalidate(["users"]);
  return useMutation({
    mutationFn: (payload: UserPayload) => apiFetch<User>("/api/users", { method: "POST", body: payload }),
    onSuccess: invalidate,
  });
}

export function useUpdateUser() {
  const invalidate = useInvalidate(["users"]);
  return useMutation({
    mutationFn: ({ id, ...payload }: UserPayload & { id: string }) =>
      apiFetch<User>(`/api/users/${id}`, { method: "PUT", body: payload }),
    onSuccess: invalidate,
  });
}

export function useDeleteUser() {
  const invalidate = useInvalidate(["users"]);
  return useMutation({
    mutationFn: (id: string) => apiFetch<{ success: true }>(`/api/users/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}

// ---------- Configurações (admin resets) ----------

export function useResetStock() {
  return useMutation({
    mutationFn: () => apiFetch<{ message: string }>("/api/admin/reset/stock", { method: "POST" }),
  });
}

export function useResetProducts() {
  return useMutation({
    mutationFn: () => apiFetch<{ message: string }>("/api/admin/reset/products", { method: "POST" }),
  });
}

export function useResetHistory() {
  return useMutation({
    mutationFn: (date?: string) =>
      apiFetch<{ message: string }>("/api/admin/reset/history", { method: "POST", body: { date } }),
  });
}
