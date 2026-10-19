import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Modal, Alert, Switch, RefreshControl } from "react-native";
import { useAuth } from "../../lib/auth";
import { useBills, useCreateBill, useToggleBillPaid, useDeleteBill, BillPayload } from "../../lib/queries";
import { Bill } from "../../types";
import { ApiError } from "../../lib/api";

function formatBRL(value: number | null | undefined) {
  return (value ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function isOverdue(bill: Bill) {
  if (bill.isPaid) return false;
  return new Date(bill.dueDate).getTime() < Date.now();
}

export default function ContasScreen() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const bills = useBills();
  const togglePaid = useToggleBillPaid();
  const deleteBill = useDeleteBill();
  const [addOpen, setAddOpen] = useState(false);

  if (!isAdmin) {
    return (
      <View style={styles.center}>
        <Text style={styles.deniedText}>Acesso negado. Apenas a Diretoria.</Text>
      </View>
    );
  }

  function handleDelete(bill: Bill) {
    Alert.alert("Excluir conta", `Excluir "${bill.title}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () =>
          deleteBill.mutate(bill.id, {
            onError: (err) => Alert.alert("Erro", err instanceof ApiError ? err.message : "Falha ao excluir."),
          }),
      },
    ]);
  }

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={bills.isFetching} onRefresh={() => { bills.refetch(); }} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <Text style={styles.title}>Contas a pagar</Text>

        {(bills.data ?? []).map((b) => (
          <View key={b.id} style={[styles.row, isOverdue(b) && styles.rowOverdue]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{b.title}</Text>
              <Text style={styles.rowSub}>
                {formatBRL(b.amount)} · Vence {new Date(b.dueDate).toLocaleDateString("pt-BR")}
                {b.isRecurring ? " · Recorrente" : ""}
                {isOverdue(b) ? " · Atrasada" : ""}
              </Text>
            </View>
            <Pressable
              style={[styles.smallButton, b.isPaid && styles.smallButtonPaid]}
              onPress={() => togglePaid.mutate({ id: b.id, isPaid: !b.isPaid })}
            >
              <Text style={styles.smallButtonText}>{b.isPaid ? "Paga" : "Marcar paga"}</Text>
            </Pressable>
            <Pressable style={styles.deleteButton} onPress={() => handleDelete(b)}>
              <Text style={styles.deleteButtonText}>Excluir</Text>
            </Pressable>
          </View>
        ))}
        {(bills.data ?? []).length === 0 && <Text style={styles.emptyText}>Nenhuma conta cadastrada.</Text>}
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => setAddOpen(true)}>
        <Text style={styles.fabText}>+ Conta</Text>
      </Pressable>

      <AddBillModal visible={addOpen} onClose={() => setAddOpen(false)} />
    </View>
  );
}

function AddBillModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const createBill = useCreateBill();

  function reset() {
    setTitle("");
    setAmount("");
    setDueDate("");
    setIsRecurring(false);
  }

  async function handleSave() {
    if (!title.trim()) return Alert.alert("Falta título", "Informe o título da conta.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      return Alert.alert("Data inválida", "Informe a data de vencimento no formato AAAA-MM-DD.");
    }
    const payload: BillPayload = {
      title: title.trim(),
      amount: amount || undefined,
      dueDate,
      isPaid: false,
      isRecurring,
    };
    try {
      await createBill.mutateAsync(payload);
      reset();
      onClose();
    } catch (err) {
      Alert.alert("Erro", err instanceof ApiError ? err.message : "Falha ao criar conta.");
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ScrollView style={styles.modalContainer} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.modalTitle}>Nova conta</Text>

        <Text style={styles.label}>Título</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Ex: Fornecedor de gás" />

        <Text style={styles.label}>Valor (R$, opcional)</Text>
        <TextInput style={styles.input} keyboardType="decimal-pad" value={amount} onChangeText={setAmount} placeholder="0,00" />

        <Text style={styles.label}>Vencimento (AAAA-MM-DD)</Text>
        <TextInput style={styles.input} value={dueDate} onChangeText={setDueDate} placeholder="2026-12-31" />

        <View style={styles.switchRow}>
          <Text style={styles.label}>Recorrente?</Text>
          <Switch value={isRecurring} onValueChange={setIsRecurring} />
        </View>

        <Pressable style={styles.submitButton} onPress={handleSave} disabled={createBill.isPending}>
          <Text style={styles.submitText}>{createBill.isPending ? "Salvando..." : "Salvar"}</Text>
        </Pressable>
        <Pressable
          style={styles.cancelButton}
          onPress={() => {
            reset();
            onClose();
          }}
        >
          <Text style={styles.cancelText}>Cancelar</Text>
        </Pressable>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, padding: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  deniedText: { color: "#888" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 20 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 8,
  },
  rowOverdue: { borderColor: "#c0392b", backgroundColor: "#fdf0ef" },
  rowTitle: { fontWeight: "600" },
  rowSub: { color: "#888", fontSize: 12, marginTop: 2 },
  emptyText: { color: "#888" },
  smallButton: { backgroundColor: "#111", paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8 },
  smallButtonPaid: { backgroundColor: "#2e7d32" },
  smallButtonText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  deleteButton: { paddingVertical: 8, paddingHorizontal: 6 },
  deleteButtonText: { color: "#c0392b", fontSize: 12, fontWeight: "600" },
  fab: { position: "absolute", right: 20, bottom: 24, backgroundColor: "#111", paddingVertical: 14, paddingHorizontal: 22, borderRadius: 30 },
  fabText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  modalContainer: { flex: 1, padding: 20, paddingTop: 60 },
  modalTitle: { fontSize: 22, fontWeight: "700", marginBottom: 20 },
  label: { fontSize: 14, color: "#555", marginTop: 16, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16 },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 16 },
  submitButton: { backgroundColor: "#111", paddingVertical: 14, borderRadius: 10, alignItems: "center", marginTop: 28 },
  submitText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  cancelButton: { paddingVertical: 14, alignItems: "center" },
  cancelText: { color: "#888" },
});
