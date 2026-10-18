import { useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, RefreshControl, Alert } from "react-native";
import { useAuth } from "../../lib/auth";
import {
  useProducts,
  useClosingSummary,
  usePendingPickups,
  useTodaySales,
  useConfirmPickup,
  useDeleteSale,
  useCloseRegister,
} from "../../lib/queries";
import SellModal from "../../components/SellModal";
import { ApiError } from "../../lib/api";

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [sellModalOpen, setSellModalOpen] = useState(false);

  const products = useProducts();
  const summary = useClosingSummary();
  const pending = usePendingPickups();
  const todaySales = useTodaySales();

  const confirmPickup = useConfirmPickup();
  const deleteSale = useDeleteSale();
  const closeRegister = useCloseRegister();

  const refreshing =
    products.isFetching || summary.isFetching || pending.isFetching || todaySales.isFetching;

  function refresh() {
    products.refetch();
    summary.refetch();
    pending.refetch();
    todaySales.refetch();
  }

  function handleConfirmPickup(id: string) {
    confirmPickup.mutate(id, {
      onError: (err) =>
        Alert.alert("Erro", err instanceof ApiError ? err.message : "Não foi possível confirmar."),
    });
  }

  function handleDeleteSale(id: string) {
    Alert.alert("Excluir venda", "Tem certeza? Essa ação não pode ser desfeita.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () =>
          deleteSale.mutate(id, {
            onError: (err) =>
              Alert.alert("Erro", err instanceof ApiError ? err.message : "Não foi possível excluir."),
          }),
      },
    ]);
  }

  function handleCloseRegister() {
    Alert.alert("Fechar caixa", "Confirma o fechamento do caixa de hoje?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Fechar",
        onPress: () =>
          closeRegister.mutate(undefined, {
            onError: (err) =>
              Alert.alert("Erro", err instanceof ApiError ? err.message : "Não foi possível fechar o caixa."),
            onSuccess: () => Alert.alert("Caixa fechado", "Fechamento registrado com sucesso."),
          }),
      },
    ]);
  }

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <Text style={styles.greeting}>Olá, {user?.name}</Text>

        <Text style={styles.sectionTitle}>Estoque</Text>
        <View style={styles.cardsRow}>
          {(products.data ?? []).map((p) => (
            <View key={p.id} style={styles.stockCard}>
              <Text style={styles.stockName}>{p.name}</Text>
              <Text style={[styles.stockValue, p.currentStock <= 5 && styles.stockLow]}>
                {p.currentStock}
              </Text>
              {p.currentStock <= 5 && <Text style={styles.lowBadge}>Estoque baixo</Text>}
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Caixa de hoje</Text>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTotal}>{formatBRL(summary.data?.totalRevenue ?? 0)}</Text>
          <Text style={styles.summarySub}>{summary.data?.totalSales ?? 0} vendas hoje</Text>
          <View style={styles.summaryGrid}>
            <Text style={styles.summaryItem}>PIX: {formatBRL(summary.data?.pixTotal ?? 0)}</Text>
            <Text style={styles.summaryItem}>Dinheiro: {formatBRL(summary.data?.cashTotal ?? 0)}</Text>
            <Text style={styles.summaryItem}>Cartão: {formatBRL(summary.data?.cardTotal ?? 0)}</Text>
            <Text style={styles.summaryItem}>Fiado: {formatBRL(summary.data?.clientTotal ?? 0)}</Text>
          </View>
        </View>

        {(pending.data ?? []).length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Aguardando retirada</Text>
            {(pending.data ?? []).map((tx) => (
              <View key={tx.id} style={styles.listItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listItemTitle}>
                    {tx.quantity}x {tx.product?.name}
                  </Text>
                  <Text style={styles.listItemSub}>{tx.customer?.name ?? "Sem cliente"}</Text>
                </View>
                <Pressable style={styles.smallButton} onPress={() => handleConfirmPickup(tx.id)}>
                  <Text style={styles.smallButtonText}>Confirmar retirada</Text>
                </Pressable>
              </View>
            ))}
          </>
        )}

        <Text style={styles.sectionTitle}>Vendas de hoje</Text>
        {(todaySales.data ?? []).length === 0 && <Text style={styles.emptyText}>Nenhuma venda ainda.</Text>}
        {(todaySales.data ?? []).map((tx) => (
          <View key={tx.id} style={styles.listItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.listItemTitle}>
                {tx.quantity}x {tx.product?.name} — {formatBRL(tx.price ?? 0)}
              </Text>
              <Text style={styles.listItemSub}>
                {tx.paymentMethod}
                {tx.isPendingPickup ? " · aguardando retirada" : ""}
              </Text>
            </View>
            {isAdmin && (
              <Pressable style={styles.deleteButton} onPress={() => handleDeleteSale(tx.id)}>
                <Text style={styles.deleteButtonText}>Excluir</Text>
              </Pressable>
            )}
          </View>
        ))}

        {isAdmin && (
          <Pressable style={styles.closeRegisterButton} onPress={handleCloseRegister}>
            <Text style={styles.closeRegisterText}>Fechar caixa</Text>
          </Pressable>
        )}
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => setSellModalOpen(true)}>
        <Text style={styles.fabText}>+ Vender</Text>
      </Pressable>

      <SellModal
        visible={sellModalOpen}
        onClose={() => setSellModalOpen(false)}
        products={products.data ?? []}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, padding: 20 },
  greeting: { fontSize: 22, fontWeight: "700", marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginTop: 24, marginBottom: 10 },
  cardsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  stockCard: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    padding: 14,
    minWidth: 100,
    backgroundColor: "#fafafa",
  },
  stockName: { fontSize: 13, color: "#555" },
  stockValue: { fontSize: 24, fontWeight: "700", marginTop: 4 },
  stockLow: { color: "#c0392b" },
  lowBadge: { fontSize: 11, color: "#c0392b", marginTop: 2 },
  summaryBox: { borderWidth: 1, borderColor: "#eee", borderRadius: 12, padding: 16, backgroundColor: "#fafafa" },
  summaryTotal: { fontSize: 28, fontWeight: "700" },
  summarySub: { color: "#888", marginBottom: 10 },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  summaryItem: { fontSize: 13, color: "#333" },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 8,
  },
  listItemTitle: { fontWeight: "600" },
  listItemSub: { color: "#888", fontSize: 12, marginTop: 2 },
  emptyText: { color: "#888" },
  smallButton: { backgroundColor: "#111", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  smallButtonText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  deleteButton: { paddingVertical: 8, paddingHorizontal: 10 },
  deleteButtonText: { color: "#c0392b", fontSize: 12, fontWeight: "600" },
  closeRegisterButton: {
    backgroundColor: "#111",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 28,
  },
  closeRegisterText: { color: "#fff", fontWeight: "600" },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    backgroundColor: "#111",
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  fabText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
