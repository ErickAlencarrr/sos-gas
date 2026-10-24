import { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Alert, RefreshControl } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../../lib/auth";
import { useClosings, useFixOrphaned, useProductSales } from "../../../lib/queries";
import { DailyClosing } from "../../../types";
import { ApiError } from "../../../lib/api";
import { colors } from "../../../lib/theme";

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function toISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function firstDayOfMonthISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

type GroupMode = "day" | "week" | "month" | "products";

function weekKey(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-S${weekNo}`;
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export default function RelatoriosScreen() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const closings = useClosings();
  const fixOrphaned = useFixOrphaned();
  const [mode, setMode] = useState<GroupMode>("day");
  const [productFrom, setProductFrom] = useState(firstDayOfMonthISO());
  const [productTo, setProductTo] = useState(toISODate(new Date()));
  const productSales = useProductSales(productFrom, productTo);

  function applyProductPreset(preset: "today" | "week" | "month" | "year") {
    const now = new Date();
    const to = toISODate(now);
    let from = to;
    if (preset === "week") {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      from = toISODate(d);
    } else if (preset === "month") {
      from = firstDayOfMonthISO();
    } else if (preset === "year") {
      from = `${now.getFullYear()}-01-01`;
    }
    setProductFrom(from);
    setProductTo(to);
  }

  if (!isAdmin) {
    return (
      <View style={styles.center}>
        <Text style={styles.deniedText}>Acesso negado. Apenas a Diretoria.</Text>
      </View>
    );
  }

  const groups = useMemo(() => {
    const list = [...(closings.data ?? [])].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    if (mode === "day") return list.map((c) => ({ key: c.id, label: new Date(c.date).toLocaleDateString("pt-BR"), closings: [c] }));

    const map = new Map<string, DailyClosing[]>();
    for (const c of list) {
      const key = mode === "week" ? weekKey(new Date(c.date)) : monthKey(new Date(c.date));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return Array.from(map.entries()).map(([key, closings]) => ({ key, label: key, closings }));
  }, [closings.data, mode]);

  function handleFixOrphaned() {
    fixOrphaned.mutate(undefined, {
      onSuccess: (result) =>
        Alert.alert("Feito", `${(result as { created?: number })?.created ?? 0} fechamento(s) recuperado(s).`),
      onError: (err) => Alert.alert("Erro", err instanceof ApiError ? err.message : "Falha ao recuperar."),
    });
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={closings.isFetching} onRefresh={() => { closings.refetch(); }} />}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <Text style={styles.title}>Relatórios</Text>

      <View style={styles.tabRow}>
        {([
          ["day", "Diário"],
          ["week", "Semanal"],
          ["month", "Mensal"],
          ["products", "Produtos"],
        ] as [GroupMode, string][]).map(([key, label]) => (
          <Pressable key={key} style={[styles.tab, mode === key && styles.tabActive]} onPress={() => setMode(key)}>
            <Text style={[styles.tabText, mode === key && styles.tabTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {mode === "products" ? (
        <>
          <View style={styles.presetRow}>
            {([
              ["today", "Hoje"],
              ["week", "7 dias"],
              ["month", "Este mês"],
              ["year", "Este ano"],
            ] as ["today" | "week" | "month" | "year", string][]).map(([key, label]) => (
              <Pressable key={key} style={styles.presetChip} onPress={() => applyProductPreset(key)}>
                <Text style={styles.presetChipText}>{label}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.rangeLabel}>
            {new Date(productFrom + "T00:00:00").toLocaleDateString("pt-BR")} até {new Date(productTo + "T00:00:00").toLocaleDateString("pt-BR")}
          </Text>

          {productSales.isLoading && <Text style={styles.emptyText}>Carregando...</Text>}
          {(productSales.data?.products ?? []).length === 0 && !productSales.isLoading && (
            <Text style={styles.emptyText}>Nenhuma venda no período.</Text>
          )}
          {(productSales.data?.products ?? []).map((p) => (
            <View key={p.productId} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{p.productName}</Text>
                <Text style={styles.rowSub}>{p.totalQuantity} un vendidas</Text>
              </View>
              <Text style={styles.rowValue}>{formatBRL(p.totalRevenue)}</Text>
            </View>
          ))}
          {(productSales.data?.products ?? []).length > 0 && (
            <View style={[styles.row, styles.totalRow]}>
              <Text style={styles.rowTitle}>Total</Text>
              <Text style={styles.rowValue}>{formatBRL(productSales.data?.totalRevenue ?? 0)}</Text>
            </View>
          )}
        </>
      ) : (
        <>
          <Pressable style={styles.fixButton} onPress={handleFixOrphaned} disabled={fixOrphaned.isPending}>
            <Text style={styles.fixButtonText}>
              {fixOrphaned.isPending ? "Recuperando..." : "Recuperar dias pendentes"}
            </Text>
          </Pressable>

          {groups.map((group) => {
        const totalRevenue = group.closings.reduce((acc, c) => acc + c.totalRevenue, 0);
        const totalSales = group.closings.reduce((acc, c) => acc + c.totalSales, 0);
        return (
          <Pressable
            key={group.key}
            style={styles.row}
            onPress={() => {
              if (mode === "day") {
                router.push(`/relatorios/${group.closings[0].id}` as Parameters<typeof router.push>[0]);
              }
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{group.label}</Text>
              <Text style={styles.rowSub}>{totalSales} vendas</Text>
            </View>
            <Text style={styles.rowValue}>{formatBRL(totalRevenue)}</Text>
          </Pressable>
            );
          })}
          {groups.length === 0 && <Text style={styles.emptyText}>Nenhum fechamento registrado.</Text>}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: colors.screenBg },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: colors.screenBg },
  deniedText: { color: colors.slate400 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 16, color: colors.slate900 },
  tabRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  tab: { flex: 1, borderWidth: 1, borderColor: colors.slate200, backgroundColor: colors.white, borderRadius: 12, paddingVertical: 10, alignItems: "center" },
  tabActive: { backgroundColor: colors.brand600, borderColor: colors.brand600 },
  tabText: { color: colors.slate600, fontWeight: "700" },
  tabTextActive: { color: colors.white },
  fixButton: { borderWidth: 1, borderColor: colors.brand600, borderRadius: 12, paddingVertical: 10, alignItems: "center", marginBottom: 16 },
  fixButtonText: { color: colors.brand600, fontWeight: "700" },
  presetRow: { flexDirection: "row", gap: 8, marginBottom: 12, flexWrap: "wrap" },
  presetChip: { backgroundColor: colors.slate100, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  presetChipText: { color: colors.slate600, fontWeight: "700", fontSize: 12 },
  rangeLabel: { color: colors.slate500, fontSize: 13, marginBottom: 12, fontWeight: "600" },
  totalRow: { backgroundColor: colors.brand50, borderColor: colors.brand100 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.slate200,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
  },
  rowTitle: { fontWeight: "600", color: colors.slate900 },
  rowSub: { color: colors.slate500, fontSize: 12, marginTop: 2 },
  rowValue: { fontWeight: "700", color: colors.slate900 },
  emptyText: { color: colors.slate400 },
});
