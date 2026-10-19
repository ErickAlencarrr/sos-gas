import { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from "react-native";
import { Product, Customer, PaymentMethod } from "../types";
import { useCreateSale, useCustomers } from "../lib/queries";
import { ApiError } from "../lib/api";
import { colors } from "../lib/theme";

const PAYMENT_METHODS: { key: PaymentMethod; label: string }[] = [
  { key: "PIX", label: "PIX" },
  { key: "CASH", label: "Dinheiro" },
  { key: "CARD", label: "Cartão" },
  { key: "CLIENT", label: "Fiado" },
];

export default function SellModal({
  visible,
  onClose,
  products,
}: {
  visible: boolean;
  onClose: () => void;
  products: Product[];
}) {
  const [productId, setProductId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PIX");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [returnedEmpty, setReturnedEmpty] = useState(true);
  const [isPendingPickup, setIsPendingPickup] = useState(false);

  const { data: customers } = useCustomers();
  const createSale = useCreateSale();

  function reset() {
    setProductId(null);
    setQuantity("1");
    setPrice("");
    setPaymentMethod("PIX");
    setCustomerId(null);
    setReturnedEmpty(true);
    setIsPendingPickup(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit() {
    if (!productId) {
      Alert.alert("Falta produto", "Selecione um produto.");
      return;
    }
    const qty = parseInt(quantity, 10);
    const priceNum = parseFloat(price.replace(",", "."));
    if (!qty || qty <= 0) {
      Alert.alert("Quantidade inválida", "Informe uma quantidade válida.");
      return;
    }
    if (!priceNum || priceNum <= 0) {
      Alert.alert("Preço inválido", "Informe um preço válido.");
      return;
    }
    if (paymentMethod === "CLIENT" && !customerId) {
      Alert.alert("Falta cliente", "Selecione o cliente para venda fiado.");
      return;
    }

    try {
      await createSale.mutateAsync({
        productId,
        type: "OUT",
        quantity: qty,
        price: priceNum,
        paymentMethod,
        customerId: paymentMethod === "CLIENT" ? customerId! : undefined,
        returnedEmpty,
        isPendingPickup,
      });
      handleClose();
    } catch (err) {
      Alert.alert("Erro", err instanceof ApiError ? err.message : "Não foi possível registrar a venda.");
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.title}>Nova venda</Text>

        <Text style={styles.label}>Produto</Text>
        <View style={styles.chipRow}>
          {products.map((p) => (
            <Pressable
              key={p.id}
              style={[styles.chip, productId === p.id && styles.chipActive]}
              onPress={() => setProductId(p.id)}
            >
              <Text style={[styles.chipText, productId === p.id && styles.chipTextActive]}>{p.name}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Quantidade</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={quantity}
          onChangeText={setQuantity}
        />

        <Text style={styles.label}>Preço total (R$)</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          value={price}
          onChangeText={setPrice}
          placeholder="0,00"
        />

        <Text style={styles.label}>Forma de pagamento</Text>
        <View style={styles.chipRow}>
          {PAYMENT_METHODS.map((m) => (
            <Pressable
              key={m.key}
              style={[styles.chip, paymentMethod === m.key && styles.chipActive]}
              onPress={() => setPaymentMethod(m.key)}
            >
              <Text style={[styles.chipText, paymentMethod === m.key && styles.chipTextActive]}>{m.label}</Text>
            </Pressable>
          ))}
        </View>

        {paymentMethod === "CLIENT" && (
          <>
            <Text style={styles.label}>Cliente</Text>
            <View style={styles.chipRow}>
              {(customers ?? []).map((c: Customer) => (
                <Pressable
                  key={c.id}
                  style={[styles.chip, customerId === c.id && styles.chipActive]}
                  onPress={() => setCustomerId(c.id)}
                >
                  <Text style={[styles.chipText, customerId === c.id && styles.chipTextActive]}>{c.name}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        <View style={styles.switchRow}>
          <Text style={styles.label}>Cliente devolveu o vasilhame vazio?</Text>
          <Switch value={returnedEmpty} onValueChange={setReturnedEmpty} />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.label}>Pago mas vai buscar depois (aguardando retirada)?</Text>
          <Switch value={isPendingPickup} onValueChange={setIsPendingPickup} />
        </View>

        <Pressable style={styles.submitButton} onPress={handleSubmit} disabled={createSale.isPending}>
          <Text style={styles.submitText}>{createSale.isPending ? "Salvando..." : "Registrar venda"}</Text>
        </Pressable>

        <Pressable style={styles.cancelButton} onPress={handleClose}>
          <Text style={styles.cancelText}>Cancelar</Text>
        </Pressable>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: colors.white },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 20, color: colors.slate900 },
  label: { fontSize: 14, color: colors.slate600, marginTop: 16, marginBottom: 6, flexShrink: 1 },
  input: {
    borderWidth: 1,
    borderColor: colors.slate200,
    backgroundColor: colors.slate50,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.slate900,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: colors.slate200,
    backgroundColor: colors.slate50,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: colors.brand600, borderColor: colors.brand600 },
  chipText: { color: colors.slate600 },
  chipTextActive: { color: colors.white },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    gap: 12,
  },
  submitButton: {
    backgroundColor: colors.brand600,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 28,
  },
  submitText: { color: colors.white, fontWeight: "700", fontSize: 16 },
  cancelButton: { paddingVertical: 14, alignItems: "center" },
  cancelText: { color: colors.slate400 },
});
