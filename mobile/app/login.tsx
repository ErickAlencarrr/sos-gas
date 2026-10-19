import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../lib/auth";
import { ApiError } from "../lib/api";
import { colors } from "../lib/theme";

export default function LoginScreen() {
  const { login, shouldOfferBiometric, enableBiometric } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    if (!email || !password) {
      setError("Preencha e-mail e senha");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);

      const offer = await shouldOfferBiometric();
      if (offer) {
        Alert.alert(
          "Login rápido",
          "Quer usar Face ID / biometria para entrar da próxima vez?",
          [
            { text: "Agora não", style: "cancel", onPress: () => enableBiometric(false) },
            { text: "Ativar", onPress: () => enableBiometric(true) },
          ]
        );
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.title}>SOS Gás</Text>

      <TextInput
        style={styles.input}
        placeholder="E-mail"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>Entrar</Text>}
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, gap: 12, backgroundColor: colors.screenBg },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 24, textAlign: "center", color: colors.brand700 },
  input: {
    borderWidth: 1,
    borderColor: colors.slate200,
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.slate900,
  },
  error: { color: colors.red600 },
  button: {
    backgroundColor: colors.brand600,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: colors.white, fontWeight: "700", fontSize: 16 },
});
