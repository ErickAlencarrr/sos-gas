import { Redirect, Slot, usePathname } from "expo-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { queryClient } from "../lib/queryClient";
import { AuthProvider, useAuth } from "../lib/auth";
import LockScreen from "../components/LockScreen";

function Gate() {
  const { status } = useAuth();
  const pathname = usePathname();

  if (status === "loading") return null;

  if (status === "unauthenticated" && pathname !== "/login") {
    return <Redirect href="/login" />;
  }

  if (status === "authenticated" && pathname === "/login") {
    return <Redirect href="/" />;
  }

  if (status === "locked") {
    return <LockScreen />;
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StatusBar style="auto" />
        <Gate />
      </AuthProvider>
    </QueryClientProvider>
  );
}
