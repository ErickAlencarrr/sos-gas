import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./api";
import { Product, Customer, Transaction, ClosingSummary, DailyClosing } from "../types";

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

function useInvalidateDashboard() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["closing-summary"] });
    queryClient.invalidateQueries({ queryKey: ["pending-pickups"] });
    queryClient.invalidateQueries({ queryKey: ["today-sales"] });
    queryClient.invalidateQueries({ queryKey: ["customers"] });
  };
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
  const invalidate = useInvalidateDashboard();
  return useMutation({
    mutationFn: () => apiFetch<DailyClosing>("/api/closing", { method: "POST" }),
    onSuccess: invalidate,
  });
}
