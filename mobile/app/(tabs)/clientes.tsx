import { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
  RefreshControl,
} from "react-native";
import { useAuth } from "../../lib/auth";
import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
  usePayCustomerDebt,
  useCustomerHistory,
} from "../../lib/queries";
import { Customer } from "../../types";
import { ApiError } from "../../lib/api";
import { colors } from "../../lib/theme";

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ClientesScreen() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const customers = useCustomers();
  const deleteCustomer = useDeleteCustomer();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [paying, setPaying] = useState<Customer | null>(null);
  const [viewingHistory, setViewingHistory] = useState<Customer | null>(null);

  if (!isAdmin) {
    return (
      <View style={styles.center}>
        <Text style={styles.deniedText}>Acesso negado. Apenas a Diretoria.</Text>
      </View>
    );
  }

  const filtered = useMemo(() => {
    const list = customers.data ?? [];
    if (!search.trim()) return list;
    return list.filter((c) => c.name.toLowerCase().includes(search.trim().toLowerCase()));
  }, [customers.data, search]);

  const totalDebt = useMemo(() => (customers.data ?? []).reduce((acc, c) => acc + c.balance, 0), [customers.data]);

  function handleDelete(customer: Customer) {
    Alert.alert("Excluir cliente", `Excluir "${customer.name}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () =>
          deleteCustomer.mutate(customer.id, {
            onError: (err) => Alert.alert("Erro", err instanceof ApiError ? err.message : "Falha ao excluir."),
          }),
      },
    ]);
  }

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={customers.isFetching} onRefresh={() => { customers.refetch(); }} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <Text style={styles.title}>Clientes</Text>

        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Total em dívidas (fiado)</Text>
          <Text style={styles.summaryValue}>{formatBRL(totalDebt)}</Text>
        </View>

        <TextInput style={styles.searchInput} placeholder="Buscar cliente..." value={search} onChangeText={setSearch} />

        {filtered.map((c) => (
          <View key={c.id} style={styles.row}>
            <Pressable style={{ flex: 1 }} onPress={() => setViewingHistory(c)}>
              <Text style={styles.rowTitle}>{c.name}</Text>
              <Text style={[styles.rowSub, c.balance > 0 && styles.debtText]}>
                {c.balance > 0 ? `Deve ${formatBRL(c.balance)}` : "Sem dívida"}
              </Text>
            </Pressable>
            {c.balance > 0 && (
              <Pressable style={styles.smallButton} onPress={() => setPaying(c)}>
                <Text style={styles.smallButtonText}>Baixar</Text>
              </Pressable>
            )}
            <Pressable style={styles.editButton} onPress={() => setEditing(c)}>
              <Text style={styles.editButtonText}>Editar</Text>
            </Pressable>
            <Pressable style={styles.deleteButton} onPress={() => handleDelete(c)}>
              <Text style={styles.deleteButtonText}>Excluir</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => setAddOpen(true)}>
        <Text style={styles.fabText}>+ Cliente</Text>
      </Pressable>

      <AddCustomerModal visible={addOpen} onClose={() => setAddOpen(false)} />
      <EditCustomerModal customer={editing} onClose={() => setEditing(null)} />
      <PayDebtModal customer={paying} onClose={() => setPaying(null)} />
      <HistoryModal customer={viewingHistory} onClose={() => setViewingHistory(null)} />
    </View>
  );
}

function AddCustomerModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const createCustomer = useCreateCustomer();

  async function handleSave() {
    if (!name.trim()) return Alert.alert("Falta nome", "Informe o nome do cliente.");
    try {
      await createCustomer.mutateAsync(name.trim());
      setName("");
      onClose();
    } catch (err) {
      Alert.alert("Erro", err instanceof ApiError ? err.message : "Falha ao criar cliente.");
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Novo cliente</Text>
          <TextInput style={styles.input} placeholder="Nome" value={name} onChangeText={setName} />
          <Pressable style={styles.submitButton} onPress={handleSave} disabled={createCustomer.isPending}>
            <Text style={styles.submitText}>{createCustomer.isPending ? "Salvando..." : "Salvar"}</Text>
          </Pressable>
          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function EditCustomerModal({ customer, onClose }: { customer: Customer | null; onClose: () => void }) {
  const [name, setName] = useState(customer?.name ?? "");
  const updateCustomer = useUpdateCustomer();

  async function handleSave() {
    if (!customer || !name.trim()) return;
    try {
      await updateCustomer.mutateAsync({ id: customer.id, name: name.trim() });
      onClose();
    } catch (err) {
      Alert.alert("Erro", err instanceof ApiError ? err.message : "Falha ao editar.");
    }
  }

  return (
    <Modal visible={!!customer} transparent animationType="fade" onShow={() => setName(customer?.name ?? "")} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Editar cliente</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />
          <Pressable style={styles.submitButton} onPress={handleSave} disabled={updateCustomer.isPending}>
            <Text style={styles.submitText}>{updateCustomer.isPending ? "Salvando..." : "Salvar"}</Text>
          </Pressable>
          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function PayDebtModal({ customer, onClose }: { customer: Customer | null; onClose: () => void }) {
  const [amount, setAmount] = useState("");
  const payDebt = usePayCustomerDebt();

  async function handlePay() {
    if (!customer) return;
    const value = parseFloat(amount.replace(",", "."));
    if (!value || value <= 0) return Alert.alert("Valor inválido", "Informe um valor válido.");
    try {
      await payDebt.mutateAsync({ customerId: customer.id, amount: value });
      setAmount("");
      onClose();
    } catch (err) {
      Alert.alert("Erro", err instanceof ApiError ? err.message : "Falha ao baixar dívida.");
    }
  }

  return (
    <Modal visible={!!customer} transparent animationType="fade" onShow={() => setAmount("")} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Baixar dívida — {customer?.name}</Text>
          <Text style={styles.label}>Deve atualmente: {formatBRL(customer?.balance ?? 0)}</Text>
          <TextInput
            style={styles.input}
            placeholder="Valor pago (R$)"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
          <Pressable style={styles.submitButton} onPress={handlePay} disabled={payDebt.isPending}>
            <Text style={styles.submitText}>{payDebt.isPending ? "Salvando..." : "Confirmar"}</Text>
          </Pressable>
          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function HistoryModal({ customer, onClose }: { customer: Customer | null; onClose: () => void }) {
  const history = useCustomerHistory(customer?.id ?? null);

  return (
    <Modal visible={!!customer} animationType="slide" onRequestClose={onClose}>
      <ScrollView style={styles.modalContainer} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.modalTitle}>Histórico — {customer?.name}</Text>
        {history.isLoading && <Text style={styles.label}>Carregando...</Text>}
        {(history.data ?? []).length === 0 && !history.isLoading && (
          <Text style={styles.label}>Nenhuma compra registrada.</Text>
        )}
        {(history.data ?? []).map((tx) => (
          <View key={tx.id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>
                {tx.quantity}x {tx.product?.name} — {formatBRL(tx.price ?? 0)}
              </Text>
              <Text style={styles.rowSub}>{new Date(tx.createdAt).toLocaleDateString("pt-BR")}</Text>
            </View>
          </View>
        ))}
        <Pressable style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelText}>Fechar</Text>
        </Pressable>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.screenBg },
  container: { flex: 1, padding: 20, backgroundColor: colors.screenBg },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: colors.screenBg },
  deniedText: { color: colors.slate400 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 16, color: colors.slate900 },
  summaryBox: { borderWidth: 1, borderColor: colors.red100, borderRadius: 16, padding: 16, backgroundColor: colors.red50, marginBottom: 16 },
  summaryLabel: { color: colors.red700, fontSize: 13, fontWeight: "600" },
  summaryValue: { fontSize: 24, fontWeight: "700", color: colors.red600 },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.slate200,
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
    color: colors.slate900,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.slate200,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    gap: 6,
  },
  rowTitle: { fontWeight: "600", color: colors.slate900 },
  rowSub: { color: colors.slate500, fontSize: 12, marginTop: 2 },
  debtText: { color: colors.red600, fontWeight: "700" },
  smallButton: { backgroundColor: colors.green100, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 12 },
  smallButtonText: { color: colors.green700, fontSize: 12, fontWeight: "700" },
  editButton: { backgroundColor: colors.slate100, paddingVertical: 8, paddingHorizontal: 8, borderRadius: 12 },
  editButtonText: { color: colors.slate600, fontSize: 12, fontWeight: "600" },
  deleteButton: { backgroundColor: colors.red50, paddingVertical: 8, paddingHorizontal: 6, borderRadius: 12 },
  deleteButtonText: { color: colors.red600, fontSize: 12, fontWeight: "600" },
  fab: { position: "absolute", right: 20, bottom: 24, backgroundColor: colors.brand600, paddingVertical: 14, paddingHorizontal: 22, borderRadius: 30, shadowColor: colors.brand500, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  fabText: { color: colors.white, fontWeight: "700", fontSize: 15 },
  overlay: { flex: 1, backgroundColor: "rgba(15,23,42,0.5)", justifyContent: "center", padding: 24 },
  card: { backgroundColor: colors.white, borderRadius: 20, padding: 20 },
  cardTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16, color: colors.slate900 },
  modalContainer: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: colors.white },
  modalTitle: { fontSize: 22, fontWeight: "700", marginBottom: 20, color: colors.slate900 },
  label: { fontSize: 14, color: colors.slate600, marginBottom: 10 },
  input: { borderWidth: 1, borderColor: colors.slate200, backgroundColor: colors.slate50, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, marginBottom: 16, color: colors.slate900 },
  submitButton: { backgroundColor: colors.brand600, paddingVertical: 14, borderRadius: 16, alignItems: "center" },
  submitText: { color: colors.white, fontWeight: "700", fontSize: 16 },
  cancelButton: { paddingVertical: 14, alignItems: "center" },
  cancelText: { color: colors.slate400 },
});
