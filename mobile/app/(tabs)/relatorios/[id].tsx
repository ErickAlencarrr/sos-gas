import { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useClosingDetail } from "../../../lib/queries";
import { colors } from "../../../lib/theme";

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function FechamentoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const closing = useClosingDetail(id ?? null);

  const productSummary = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of closing.data?.transactions ?? []) {
      const name = tx.product?.name ?? "—";
      map.set(name, (map.get(name) ?? 0) + tx.quantity);
    }
    return Array.from(map.entries());
  }, [closing.data]);

  if (closing.isLoading) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Carregando...</Text>
      </View>
    );
  }

  if (!closing.data) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Fechamento não encontrado.</Text>
      </View>
    );
  }

  const d = closing.data;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>{new Date(d.date).toLocaleDateString("pt-BR")}</Text>
      <Text style={styles.subtitle}>{d.totalSales} vendas · {formatBRL(d.totalRevenue)}</Text>

      <Text style={styles.sectionTitle}>Totais por forma de pagamento</Text>
      <View style={styles.summaryBox}>
        <Text style={styles.summaryItem}>PIX: {formatBRL(d.pixTotal)}</Text>
        <Text style={styles.summaryItem}>Dinheiro: {formatBRL(d.cashTotal)}</Text>
        <Text style={styles.summaryItem}>Cartão: {formatBRL(d.cardTotal)}</Text>
        <Text style={styles.summaryItem}>Fiado: {formatBRL(d.clientTotal)}</Text>
      </View>

      <Text style={styles.sectionTitle}>Produtos vendidos</Text>
      {productSummary.map(([name, qty]) => (
        <View key={name} style={styles.row}>
          <Text style={styles.rowTitle}>{name}</Text>
          <Text style={styles.rowValue}>{qty}x</Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Transações</Text>
      {(d.transactions ?? []).map((tx) => (
        <View key={tx.id} style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>
              {tx.quantity}x {tx.product?.name}
            </Text>
            <Text style={styles.rowSub}>
              {tx.paymentMethod} {tx.customer ? `· ${tx.customer.name}` : ""}
            </Text>
          </View>
          <Text style={styles.rowValue}>{formatBRL(tx.price ?? 0)}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: colors.screenBg },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.screenBg },
  emptyText: { color: colors.slate400 },
  title: { fontSize: 22, fontWeight: "700", color: colors.slate900 },
  subtitle: { color: colors.slate500, marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: "700", marginTop: 20, marginBottom: 10, color: colors.slate900, textTransform: "uppercase", letterSpacing: 0.5 },
  summaryBox: { borderWidth: 1, borderColor: colors.slate200, borderRadius: 16, padding: 16, backgroundColor: colors.white, gap: 4 },
  summaryItem: { fontSize: 14, color: colors.slate700 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.slate200,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
  },
  rowTitle: { fontWeight: "600", color: colors.slate900 },
  rowSub: { color: colors.slate500, fontSize: 12, marginTop: 2 },
  rowValue: { fontWeight: "700", color: colors.slate900 },
});
