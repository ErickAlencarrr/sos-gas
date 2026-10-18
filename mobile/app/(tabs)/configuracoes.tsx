import { View, Text, Pressable, StyleSheet } from "react-native";
import { useAuth } from "../../lib/auth";

export default function ConfiguracoesScreen() {
  const { logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configurações</Text>
      <Text style={styles.subtitle}>Resets avançados chegam na Fase 2</Text>

      <Pressable style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Sair</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", gap: 8, padding: 24 },
  title: { fontSize: 22, fontWeight: "700" },
  subtitle: { color: "#888", marginBottom: 24 },
  logoutButton: {
    backgroundColor: "#c0392b",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  logoutText: { color: "#fff", fontWeight: "600" },
});
