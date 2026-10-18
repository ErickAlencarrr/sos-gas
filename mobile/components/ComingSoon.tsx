import { View, Text, StyleSheet } from "react-native";

export default function ComingSoon({ title }: { title: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>Em construção (Fase 2)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", gap: 8 },
  title: { fontSize: 22, fontWeight: "700" },
  subtitle: { color: "#888" },
});
