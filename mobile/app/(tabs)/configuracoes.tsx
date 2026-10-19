import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Modal, Alert } from "react-native";
import { useAuth } from "../../lib/auth";
import { useResetStock, useResetProducts, useResetHistory } from "../../lib/queries";
import { ApiError } from "../../lib/api";

type DangerAction = {
  key: string;
  title: string;
  description: string;
  run: (date?: string) => Promise<unknown>;
  pending: boolean;
  askDate?: boolean;
};

export default function ConfiguracoesScreen() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [confirming, setConfirming] = useState<DangerAction | null>(null);

  const resetStock = useResetStock();
  const resetProducts = useResetProducts();
  const resetHistory = useResetHistory();

  if (!isAdmin) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Configurações</Text>
        <Pressable style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Sair</Text>
        </Pressable>
      </View>
    );
  }

  const actions: DangerAction[] = [
    {
      key: "stock",
      title: "Zerar estoque",
      description: "Zera o estoque (cheios e vazios) de todos os produtos.",
      run: () => resetStock.mutateAsync(),
      pending: resetStock.isPending,
    },
    {
      key: "products",
      title: "Apagar produtos",
      description: "Apaga todos os produtos e todo o histórico ligado a eles (vendas, cargas, fechamentos, contas).",
      run: () => resetProducts.mutateAsync(),
      pending: resetProducts.isPending,
    },
    {
      key: "history",
      title: "Apagar todo o histórico",
      description: "Apaga vendas, contas e fechamentos de todos os dias (mantém usuários, produtos e clientes).",
      run: () => resetHistory.mutateAsync(undefined),
      pending: resetHistory.isPending,
    },
  ];

  return (
    <View style={styles.flex}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.title}>Configurações</Text>

        <Text style={styles.sectionTitle}>Zona de perigo</Text>
        {actions.map((action) => (
          <View key={action.key} style={styles.dangerCard}>
            <Text style={styles.dangerTitle}>{action.title}</Text>
            <Text style={styles.dangerDescription}>{action.description}</Text>
            <Pressable style={styles.dangerButton} onPress={() => setConfirming(action)}>
              <Text style={styles.dangerButtonText}>Executar</Text>
            </Pressable>
          </View>
        ))}

        <Pressable style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Sair</Text>
        </Pressable>
      </ScrollView>

      <ConfirmModal action={confirming} onClose={() => setConfirming(null)} />
    </View>
  );
}

function ConfirmModal({ action, onClose }: { action: DangerAction | null; onClose: () => void }) {
  const [text, setText] = useState("");

  async function handleConfirm() {
    if (!action) return;
    if (text.trim().toUpperCase() !== "CONFIRMAR") {
      Alert.alert("Digite CONFIRMAR", 'Escreva exatamente "CONFIRMAR" pra prosseguir.');
      return;
    }
    try {
      const result = (await action.run()) as { message?: string } | undefined;
      Alert.alert("Feito", result?.message ?? "Ação concluída.");
      setText("");
      onClose();
    } catch (err) {
      Alert.alert("Erro", err instanceof ApiError ? err.message : "Falha ao executar.");
    }
  }

  return (
    <Modal visible={!!action} transparent animationType="fade" onShow={() => setText("")} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{action?.title}</Text>
          <Text style={styles.cardDescription}>{action?.description}</Text>
          <Text style={styles.cardWarning}>Essa ação não pode ser desfeita. Digite CONFIRMAR para continuar.</Text>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            autoCapitalize="characters"
            placeholder="CONFIRMAR"
          />
          <Pressable style={styles.confirmButton} onPress={handleConfirm} disabled={action?.pending}>
            <Text style={styles.confirmButtonText}>{action?.pending ? "Executando..." : "Confirmar"}</Text>
          </Pressable>
          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, padding: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16, padding: 24 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#c0392b", marginTop: 8, marginBottom: 12 },
  dangerCard: { borderWidth: 1, borderColor: "#f5c6c3", backgroundColor: "#fdf0ef", borderRadius: 12, padding: 16, marginBottom: 12 },
  dangerTitle: { fontWeight: "700", marginBottom: 4 },
  dangerDescription: { color: "#555", fontSize: 13, marginBottom: 12 },
  dangerButton: { backgroundColor: "#c0392b", paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  dangerButtonText: { color: "#fff", fontWeight: "600" },
  logoutButton: { backgroundColor: "#111", paddingVertical: 12, paddingHorizontal: 32, borderRadius: 10, alignItems: "center", marginTop: 24 },
  logoutText: { color: "#fff", fontWeight: "600" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 24 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 20 },
  cardTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  cardDescription: { color: "#555", fontSize: 13, marginBottom: 12 },
  cardWarning: { color: "#c0392b", fontSize: 13, fontWeight: "600", marginBottom: 12 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, marginBottom: 16 },
  confirmButton: { backgroundColor: "#c0392b", paddingVertical: 14, borderRadius: 10, alignItems: "center" },
  confirmButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  cancelButton: { paddingVertical: 14, alignItems: "center" },
  cancelText: { color: "#888" },
});
