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
  Switch,
  RefreshControl,
} from "react-native";
import { useAuth } from "../../lib/auth";
import { useProducts, useReceiveStock } from "../../lib/queries";
import { Product } from "../../types";
import { ApiError } from "../../lib/api";

export default function InventarioScreen() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const products = useProducts();
  const [receiving, setReceiving] = useState<Product | null>(null);

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={products.isFetching} onRefresh={() => { products.refetch(); }} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <Text style={styles.title}>Inventário</Text>

        {(products.data ?? []).map((p) => (
          <View key={p.id} style={styles.card}>
            <Text style={styles.cardName}>{p.name}</Text>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Pronto p/ Venda</Text>
                <Text style={styles.statValue}>{p.currentStock}</Text>
              </View>
              {p.type !== "OTHERS" && (
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Aguardando Carga</Text>
                  <Text style={styles.statValue}>{p.emptyStock}</Text>
                </View>
              )}
            </View>
            {isAdmin && (
              <Pressable style={styles.receiveButton} onPress={() => setReceiving(p)}>
                <Text style={styles.receiveButtonText}>Receber Carga</Text>
              </Pressable>
            )}
          </View>
        ))}
      </ScrollView>

      <ReceiveModal product={receiving} onClose={() => setReceiving(null)} />
    </View>
  );
}

function ReceiveModal({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const [quantity, setQuantity] = useState("");
  const [returnedEmpty, setReturnedEmpty] = useState(true);
  const [emptyQuantity, setEmptyQuantity] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [hasBoleto, setHasBoleto] = useState(false);
  const [boletoAmount, setBoletoAmount] = useState("");
  const [boletoDueDate, setBoletoDueDate] = useState("");
  const [isBoletoPaid, setIsBoletoPaid] = useState(false);

  const receiveStock = useReceiveStock();

  function reset() {
    setQuantity("");
    setReturnedEmpty(true);
    setEmptyQuantity("");
    setInvoiceNumber("");
    setHasBoleto(false);
    setBoletoAmount("");
    setBoletoDueDate("");
    setIsBoletoPaid(false);
  }

  async function handleSave() {
    if (!product) return;
    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) return Alert.alert("Quantidade inválida", "Informe a quantidade recebida.");

    try {
      await receiveStock.mutateAsync({
        productId: product.id,
        type: "IN",
        quantity: qty,
        emptyQuantity: returnedEmpty ? parseInt(emptyQuantity || String(qty), 10) : 0,
        invoiceNumber: invoiceNumber || undefined,
        hasBoleto,
        isBoletoPaid,
        boletoAmount: hasBoleto ? boletoAmount : undefined,
        boletoDueDate: hasBoleto ? boletoDueDate : undefined,
      });
      reset();
      onClose();
    } catch (err) {
      Alert.alert("Erro", err instanceof ApiError ? err.message : "Falha ao registrar carga.");
    }
  }

  return (
    <Modal visible={!!product} animationType="slide" onRequestClose={onClose}>
      <ScrollView style={styles.modalContainer} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.modalTitle}>Receber carga — {product?.name}</Text>

        <Text style={styles.label}>Quantidade recebida</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={quantity} onChangeText={setQuantity} />

        <View style={styles.switchRow}>
          <Text style={styles.label}>Caminhão levou vasilhames vazios?</Text>
          <Switch value={returnedEmpty} onValueChange={setReturnedEmpty} />
        </View>

        {returnedEmpty && (
          <>
            <Text style={styles.label}>Quantidade de vazios devolvidos (padrão = qtd recebida)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={emptyQuantity} onChangeText={setEmptyQuantity} placeholder={quantity || "0"} />
          </>
        )}

        <Text style={styles.label}>Número da nota (opcional)</Text>
        <TextInput style={styles.input} value={invoiceNumber} onChangeText={setInvoiceNumber} />

        <View style={styles.switchRow}>
          <Text style={styles.label}>Tem boleto?</Text>
          <Switch value={hasBoleto} onValueChange={setHasBoleto} />
        </View>

        {hasBoleto && (
          <>
            <Text style={styles.label}>Valor do boleto (R$)</Text>
            <TextInput style={styles.input} keyboardType="decimal-pad" value={boletoAmount} onChangeText={setBoletoAmount} />

            <Text style={styles.label}>Vencimento (AAAA-MM-DD)</Text>
            <TextInput style={styles.input} value={boletoDueDate} onChangeText={setBoletoDueDate} placeholder="2026-12-31" />

            <View style={styles.switchRow}>
              <Text style={styles.label}>Boleto já pago?</Text>
              <Switch value={isBoletoPaid} onValueChange={setIsBoletoPaid} />
            </View>
          </>
        )}

        <Pressable style={styles.submitButton} onPress={handleSave} disabled={receiveStock.isPending}>
          <Text style={styles.submitText}>{receiveStock.isPending ? "Salvando..." : "Registrar"}</Text>
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
  title: { fontSize: 22, fontWeight: "700", marginBottom: 20 },
  card: { borderWidth: 1, borderColor: "#eee", borderRadius: 12, padding: 16, marginBottom: 12, backgroundColor: "#fafafa" },
  cardName: { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  statsRow: { flexDirection: "row", gap: 24 },
  stat: {},
  statLabel: { fontSize: 12, color: "#888" },
  statValue: { fontSize: 20, fontWeight: "700" },
  receiveButton: { backgroundColor: "#111", paddingVertical: 10, borderRadius: 8, alignItems: "center", marginTop: 14 },
  receiveButtonText: { color: "#fff", fontWeight: "600" },
  modalContainer: { flex: 1, padding: 20, paddingTop: 60 },
  modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 20 },
  label: { fontSize: 14, color: "#555", marginTop: 16, marginBottom: 6, flexShrink: 1 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16 },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 16, gap: 12 },
  submitButton: { backgroundColor: "#111", paddingVertical: 14, borderRadius: 10, alignItems: "center", marginTop: 28 },
  submitText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  cancelButton: { paddingVertical: 14, alignItems: "center" },
  cancelText: { color: "#888" },
});
