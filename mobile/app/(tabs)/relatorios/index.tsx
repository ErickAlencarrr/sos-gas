import { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Alert, RefreshControl } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../../lib/auth";
import { useClosings, useFixOrphaned } from "../../../lib/queries";
import { DailyClosing } from "../../../types";
import { ApiError } from "../../../lib/api";

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type GroupMode = "day" | "week" | "month";

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
        ] as [GroupMode, string][]).map(([key, label]) => (
          <Pressable key={key} style={[styles.tab, mode === key && styles.tabActive]} onPress={() => setMode(key)}>
            <Text style={[styles.tabText, mode === key && styles.tabTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  deniedText: { color: "#888" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 16 },
  tabRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  tab: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  tabActive: { backgroundColor: "#111", borderColor: "#111" },
  tabText: { color: "#333", fontWeight: "600" },
  tabTextActive: { color: "#fff" },
  fixButton: { borderWidth: 1, borderColor: "#111", borderRadius: 10, paddingVertical: 10, alignItems: "center", marginBottom: 16 },
  fixButtonText: { color: "#111", fontWeight: "600" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  rowTitle: { fontWeight: "600" },
  rowSub: { color: "#888", fontSize: 12, marginTop: 2 },
  rowValue: { fontWeight: "700" },
  emptyText: { color: "#888" },
});
