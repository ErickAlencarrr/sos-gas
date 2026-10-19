import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useAuth } from "../lib/auth";
import { colors } from "../lib/theme";

export default function LockScreen() {
  const { unlockWithBiometrics, usePasswordInstead, user } = useAuth();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    tryUnlock();
  }, []);

  async function tryUnlock() {
    setFailed(false);
    const ok = await unlockWithBiometrics();
    if (!ok) setFailed(true);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SOS Gás</Text>
      <Text style={styles.subtitle}>
        {user ? `Bem-vindo, ${user.name}` : "Desbloqueie para continuar"}
      </Text>

      {failed && <Text style={styles.error}>Não foi possível confirmar sua identidade.</Text>}

      <Pressable style={styles.button} onPress={tryUnlock}>
        <Text style={styles.buttonText}>Tentar novamente</Text>
      </Pressable>

      <Pressable onPress={usePasswordInstead}>
        <Text style={styles.link}>Entrar com e-mail e senha</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 12,
    backgroundColor: colors.screenBg,
  },
  title: { fontSize: 28, fontWeight: "700", color: colors.brand700 },
  subtitle: { fontSize: 16, color: colors.slate600, marginBottom: 16 },
  error: { color: colors.red600, marginBottom: 8 },
  button: {
    backgroundColor: colors.brand600,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginTop: 8,
  },
  buttonText: { color: colors.white, fontWeight: "700" },
  link: { color: colors.slate500, marginTop: 16, textDecorationLine: "underline" },
});
