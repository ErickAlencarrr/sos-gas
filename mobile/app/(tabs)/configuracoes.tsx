import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Modal, Alert } from "react-native";
import { useAuth } from "../../lib/auth";
import { useResetStock, useResetProducts, useResetHistory } from "../../lib/queries";
import { ApiError } from "../../lib/api";
import { colors } from "../../lib/theme";

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
  flex: { flex: 1, backgroundColor: colors.screenBg },
  container: { flex: 1, padding: 20, backgroundColor: colors.screenBg },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16, padding: 24, backgroundColor: colors.screenBg },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12, color: colors.slate900 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: colors.red600, marginTop: 8, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 },
  dangerCard: { borderWidth: 1, borderColor: colors.red100, backgroundColor: colors.red50, borderRadius: 16, padding: 16, marginBottom: 12 },
  dangerTitle: { fontWeight: "700", marginBottom: 4, color: colors.slate900 },
  dangerDescription: { color: colors.slate600, fontSize: 13, marginBottom: 12 },
  dangerButton: { backgroundColor: colors.red600, paddingVertical: 10, borderRadius: 12, alignItems: "center" },
  dangerButtonText: { color: colors.white, fontWeight: "700" },
  logoutButton: { backgroundColor: colors.slate900, paddingVertical: 12, paddingHorizontal: 32, borderRadius: 16, alignItems: "center", marginTop: 24 },
  logoutText: { color: colors.white, fontWeight: "700" },
  overlay: { flex: 1, backgroundColor: "rgba(15,23,42,0.5)", justifyContent: "center", padding: 24 },
  card: { backgroundColor: colors.white, borderRadius: 20, padding: 20 },
  cardTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8, color: colors.slate900 },
  cardDescription: { color: colors.slate600, fontSize: 13, marginBottom: 12 },
  cardWarning: { color: colors.red600, fontSize: 13, fontWeight: "600", marginBottom: 12 },
  input: { borderWidth: 1, borderColor: colors.slate200, backgroundColor: colors.slate50, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, marginBottom: 16, color: colors.slate900 },
  confirmButton: { backgroundColor: colors.red600, paddingVertical: 14, borderRadius: 16, alignItems: "center" },
  confirmButtonText: { color: colors.white, fontWeight: "700", fontSize: 16 },
  cancelButton: { paddingVertical: 14, alignItems: "center" },
  cancelText: { color: colors.slate400 },
});
