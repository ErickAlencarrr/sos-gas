import { useState } from "react";
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
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, ProductPayload } from "../../lib/queries";
import { Product, ProductType, ProductUnit } from "../../types";
import { ApiError } from "../../lib/api";

const TYPES: { key: ProductType; label: string }[] = [
  { key: "GAS", label: "Gás" },
  { key: "WATER", label: "Água" },
  { key: "OTHERS", label: "Diversos" },
];

const UNITS: { key: ProductUnit; label: string }[] = [
  { key: "UNIDADE", label: "Unidade" },
  { key: "PACOTE", label: "Pacote" },
  { key: "METRO", label: "Metro" },
  { key: "LITRO", label: "Litro" },
  { key: "KG", label: "Kg" },
];

export default function ProdutosScreen() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const products = useProducts();
  const deleteProduct = useDeleteProduct();
  const [editing, setEditing] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  if (!isAdmin) {
    return (
      <View style={styles.center}>
        <Text style={styles.deniedText}>Acesso negado. Apenas a Diretoria.</Text>
      </View>
    );
  }

  function handleDelete(product: Product) {
    Alert.alert("Excluir produto", `Excluir "${product.name}"? Isso apaga o histórico ligado a ele.`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () =>
          deleteProduct.mutate(product.id, {
            onError: (err) => Alert.alert("Erro", err instanceof ApiError ? err.message : "Falha ao excluir."),
          }),
      },
    ]);
  }

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={products.isFetching} onRefresh={() => { products.refetch(); }} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <Text style={styles.title}>Produtos</Text>

        {(products.data ?? []).map((p) => (
          <View key={p.id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{p.name}</Text>
              <Text style={styles.rowSub}>
                {TYPES.find((t) => t.key === p.type)?.label} · {UNITS.find((u) => u.key === p.unit)?.label} · Cheios:{" "}
                {p.currentStock} · Vazios: {p.emptyStock}
              </Text>
            </View>
            <Pressable
              style={styles.smallButton}
              onPress={() => {
                setEditing(p);
                setModalOpen(true);
              }}
            >
              <Text style={styles.smallButtonText}>Editar</Text>
            </Pressable>
            <Pressable style={styles.deleteButton} onPress={() => handleDelete(p)}>
              <Text style={styles.deleteButtonText}>Excluir</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>

      <Pressable
        style={styles.fab}
        onPress={() => {
          setEditing(null);
          setModalOpen(true);
        }}
      >
        <Text style={styles.fabText}>+ Produto</Text>
      </Pressable>

      <ProductModal visible={modalOpen} onClose={() => setModalOpen(false)} product={editing} />
    </View>
  );
}

function ProductModal({
  visible,
  onClose,
  product,
}: {
  visible: boolean;
  onClose: () => void;
  product: Product | null;
}) {
  const [name, setName] = useState(product?.name ?? "");
  const [type, setType] = useState<ProductType>(product?.type ?? "GAS");
  const [unit, setUnit] = useState<ProductUnit>(product?.unit ?? "UNIDADE");
  const [currentStock, setCurrentStock] = useState(String(product?.currentStock ?? 0));
  const [emptyStock, setEmptyStock] = useState(String(product?.emptyStock ?? 0));

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const saving = createProduct.isPending || updateProduct.isPending;

  function reset() {
    setName("");
    setType("GAS");
    setUnit("UNIDADE");
    setCurrentStock("0");
    setEmptyStock("0");
  }

  function sync(p: Product | null) {
    setName(p?.name ?? "");
    setType(p?.type ?? "GAS");
    setUnit(p?.unit ?? "UNIDADE");
    setCurrentStock(String(p?.currentStock ?? 0));
    setEmptyStock(String(p?.emptyStock ?? 0));
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert("Falta nome", "Informe o nome do produto.");
      return;
    }
    const payload: ProductPayload = {
      name: name.trim(),
      type,
      unit,
      currentStock: parseInt(currentStock || "0", 10),
      emptyStock: parseInt(emptyStock || "0", 10),
    };
    try {
      if (product) {
        await updateProduct.mutateAsync({ id: product.id, ...payload });
      } else {
        await createProduct.mutateAsync(payload);
      }
      reset();
      onClose();
    } catch (err) {
      Alert.alert("Erro", err instanceof ApiError ? err.message : "Falha ao salvar.");
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onShow={() => sync(product)}
      onRequestClose={onClose}
    >
      <ScrollView style={styles.modalContainer} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.modalTitle}>{product ? "Editar produto" : "Novo produto"}</Text>

        <Text style={styles.label}>Nome</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ex: Botijão P13" />

        <Text style={styles.label}>Tipo</Text>
        <View style={styles.chipRow}>
          {TYPES.map((t) => (
            <Pressable key={t.key} style={[styles.chip, type === t.key && styles.chipActive]} onPress={() => setType(t.key)}>
              <Text style={[styles.chipText, type === t.key && styles.chipTextActive]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Unidade</Text>
        <View style={styles.chipRow}>
          {UNITS.map((u) => (
            <Pressable key={u.key} style={[styles.chip, unit === u.key && styles.chipActive]} onPress={() => setUnit(u.key)}>
              <Text style={[styles.chipText, unit === u.key && styles.chipTextActive]}>{u.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Estoque cheios</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={currentStock} onChangeText={setCurrentStock} />

        {type !== "OTHERS" && (
          <>
            <Text style={styles.label}>Estoque vazios</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={emptyStock} onChangeText={setEmptyStock} />
          </>
        )}

        <Pressable style={styles.submitButton} onPress={handleSave} disabled={saving}>
          <Text style={styles.submitText}>{saving ? "Salvando..." : "Salvar"}</Text>
        </Pressable>
        <Pressable style={styles.cancelButton} onPress={onClose}>
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
  rowTitle: { fontWeight: "600" },
  rowSub: { color: "#888", fontSize: 12, marginTop: 2 },
  smallButton: { backgroundColor: "#111", paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8 },
  smallButtonText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  deleteButton: { paddingVertical: 8, paddingHorizontal: 6 },
  deleteButtonText: { color: "#c0392b", fontSize: 12, fontWeight: "600" },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    backgroundColor: "#111",
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 30,
  },
  fabText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  modalContainer: { flex: 1, padding: 20, paddingTop: 60 },
  modalTitle: { fontSize: 22, fontWeight: "700", marginBottom: 20 },
  label: { fontSize: 14, color: "#555", marginTop: 16, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderColor: "#ccc", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  chipActive: { backgroundColor: "#111", borderColor: "#111" },
  chipText: { color: "#333" },
  chipTextActive: { color: "#fff" },
  submitButton: { backgroundColor: "#111", paddingVertical: 14, borderRadius: 10, alignItems: "center", marginTop: 28 },
  submitText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  cancelButton: { paddingVertical: 14, alignItems: "center" },
  cancelText: { color: "#888" },
});
