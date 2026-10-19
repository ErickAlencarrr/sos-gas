import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Modal, Alert, RefreshControl } from "react-native";
import { useAuth } from "../../lib/auth";
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser, UserPayload } from "../../lib/queries";
import { User, Role } from "../../types";
import { ApiError } from "../../lib/api";
import { colors } from "../../lib/theme";

const ROLES: { key: Role; label: string }[] = [
  { key: "EMPLOYEE", label: "Funcionário" },
  { key: "ADMIN", label: "Diretoria" },
];

export default function UsuariosScreen() {
  const { user: me } = useAuth();
  const isAdmin = me?.role === "ADMIN";
  const users = useUsers();
  const deleteUser = useDeleteUser();
  const [editing, setEditing] = useState<User | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  if (!isAdmin) {
    return (
      <View style={styles.center}>
        <Text style={styles.deniedText}>Acesso negado. Apenas a Diretoria.</Text>
      </View>
    );
  }

  function handleDelete(user: User) {
    Alert.alert("Excluir usuário", `Excluir "${user.name}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () =>
          deleteUser.mutate(user.id, {
            onError: (err) => Alert.alert("Erro", err instanceof ApiError ? err.message : "Falha ao excluir."),
          }),
      },
    ]);
  }

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={users.isFetching} onRefresh={() => { users.refetch(); }} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <Text style={styles.title}>Usuários</Text>

        {(users.data ?? []).map((u) => (
          <View key={u.id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{u.name}</Text>
              <Text style={styles.rowSub}>
                {u.email} · {ROLES.find((r) => r.key === u.role)?.label}
              </Text>
            </View>
            <Pressable
              style={styles.smallButton}
              onPress={() => {
                setEditing(u);
                setModalOpen(true);
              }}
            >
              <Text style={styles.smallButtonText}>Editar</Text>
            </Pressable>
            <Pressable style={styles.deleteButton} onPress={() => handleDelete(u)}>
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
        <Text style={styles.fabText}>+ Usuário</Text>
      </Pressable>

      <UserModal visible={modalOpen} onClose={() => setModalOpen(false)} user={editing} />
    </View>
  );
}

function UserModal({ visible, onClose, user }: { visible: boolean; onClose: () => void; user: User | null }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("EMPLOYEE");

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const saving = createUser.isPending || updateUser.isPending;

  function sync(u: User | null) {
    setName(u?.name ?? "");
    setEmail(u?.email ?? "");
    setPassword("");
    setRole(u?.role ?? "EMPLOYEE");
  }

  async function handleSave() {
    if (!name.trim() || !email.trim()) return Alert.alert("Dados incompletos", "Nome e e-mail são obrigatórios.");
    if (!user && !password) return Alert.alert("Falta senha", "Informe uma senha para o novo usuário.");

    const payload: UserPayload = {
      name: name.trim(),
      email: email.trim(),
      role,
      ...(password ? { password } : {}),
    };

    try {
      if (user) {
        await updateUser.mutateAsync({ id: user.id, ...payload });
      } else {
        await createUser.mutateAsync(payload);
      }
      onClose();
    } catch (err) {
      Alert.alert("Erro", err instanceof ApiError ? err.message : "Falha ao salvar.");
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onShow={() => sync(user)} onRequestClose={onClose}>
      <ScrollView style={styles.modalContainer} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.modalTitle}>{user ? "Editar usuário" : "Novo usuário"}</Text>

        <Text style={styles.label}>Nome</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} />

        <Text style={styles.label}>E-mail</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

        <Text style={styles.label}>{user ? "Nova senha (deixe em branco pra manter)" : "Senha"}</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />

        <Text style={styles.label}>Função</Text>
        <View style={styles.chipRow}>
          {ROLES.map((r) => (
            <Pressable key={r.key} style={[styles.chip, role === r.key && styles.chipActive]} onPress={() => setRole(r.key)}>
              <Text style={[styles.chipText, role === r.key && styles.chipTextActive]}>{r.label}</Text>
            </Pressable>
          ))}
        </View>

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
  flex: { flex: 1, backgroundColor: colors.screenBg },
  container: { flex: 1, padding: 20, backgroundColor: colors.screenBg },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: colors.screenBg },
  deniedText: { color: colors.slate400 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 20, color: colors.slate900 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.slate200,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    gap: 8,
  },
  rowTitle: { fontWeight: "600", color: colors.slate900 },
  rowSub: { color: colors.slate500, fontSize: 12, marginTop: 2 },
  smallButton: { backgroundColor: colors.slate100, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 12 },
  smallButtonText: { color: colors.slate600, fontSize: 12, fontWeight: "700" },
  deleteButton: { backgroundColor: colors.red50, paddingVertical: 8, paddingHorizontal: 6, borderRadius: 12 },
  deleteButtonText: { color: colors.red600, fontSize: 12, fontWeight: "600" },
  fab: { position: "absolute", right: 20, bottom: 24, backgroundColor: colors.brand600, paddingVertical: 14, paddingHorizontal: 22, borderRadius: 30, shadowColor: colors.brand500, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  fabText: { color: colors.white, fontWeight: "700", fontSize: 15 },
  modalContainer: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: colors.white },
  modalTitle: { fontSize: 22, fontWeight: "700", marginBottom: 20, color: colors.slate900 },
  label: { fontSize: 14, color: colors.slate600, marginTop: 16, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: colors.slate200, backgroundColor: colors.slate50, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, color: colors.slate900 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.slate200, backgroundColor: colors.slate50, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  chipActive: { backgroundColor: colors.brand600, borderColor: colors.brand600 },
  chipText: { color: colors.slate600 },
  chipTextActive: { color: colors.white },
  submitButton: { backgroundColor: colors.brand600, paddingVertical: 14, borderRadius: 16, alignItems: "center", marginTop: 28 },
  submitText: { color: colors.white, fontWeight: "700", fontSize: 16 },
  cancelButton: { paddingVertical: 14, alignItems: "center" },
  cancelText: { color: colors.slate400 },
});
