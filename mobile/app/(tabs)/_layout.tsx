import { Tabs } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useAuth } from "../../lib/auth";
import { colors } from "../../lib/theme";

export default function TabsLayout() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.brand600,
        tabBarInactiveTintColor: colors.slate400,
        tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.slate200 },
        headerStyle: { backgroundColor: colors.white },
        headerTintColor: colors.slate900,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          tabBarIcon: ({ color, size }) => <FontAwesome name="home" size={size} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="inventario"
        options={{
          title: "Inventário",
          tabBarIcon: ({ color, size }) => <FontAwesome name="cubes" size={size} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="clientes"
        options={{
          title: "Clientes",
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color, size }) => <FontAwesome name="users" size={size} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="contas"
        options={{
          title: "Contas",
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color, size }) => <FontAwesome name="file-text" size={size} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="produtos"
        options={{
          title: "Produtos",
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color, size }) => <FontAwesome name="tags" size={size} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="relatorios"
        options={{
          title: "Relatórios",
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color, size }) => <FontAwesome name="bar-chart" size={size} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="usuarios"
        options={{
          title: "Usuários",
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color, size }) => <FontAwesome name="user" size={size} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="configuracoes"
        options={{
          title: "Config",
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color, size }) => <FontAwesome name="cog" size={size} color={color as string} />,
        }}
      />
    </Tabs>
  );
}
