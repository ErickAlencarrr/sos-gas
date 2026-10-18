import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as LocalAuthentication from "expo-local-authentication";
import { apiFetch, setUnauthorizedHandler } from "./api";
import {
  getToken,
  setToken,
  getStoredUser,
  setStoredUser,
  clearSession,
  isBiometricEnabled,
  setBiometricEnabled,
  hasAskedBiometric,
  setAskedBiometric,
} from "./tokenStorage";
import { User } from "../types";

type Status = "loading" | "locked" | "authenticated" | "unauthenticated";

type LoginResponse = { token: string; user: User };

type AuthContextValue = {
  status: Status;
  user: User | null;
  biometricAvailable: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  unlockWithBiometrics: () => Promise<boolean>;
  usePasswordInstead: () => Promise<void>;
  enableBiometric: (enabled: boolean) => Promise<void>;
  shouldOfferBiometric: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  const logout = useCallback(async () => {
    await clearSession();
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
    });
  }, [logout]);

  useEffect(() => {
    (async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(hasHardware && isEnrolled);

      const [token, storedUser, biometricOn] = await Promise.all([
        getToken(),
        getStoredUser(),
        isBiometricEnabled(),
      ]);

      if (!token || !storedUser) {
        setStatus("unauthenticated");
        return;
      }

      setUser(storedUser);
      setStatus(biometricOn && hasHardware && isEnrolled ? "locked" : "authenticated");
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiFetch<LoginResponse>("/api/mobile/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
    await setToken(res.token);
    await setStoredUser(res.user);
    setUser(res.user);
    setStatus("authenticated");
  }, []);

  const unlockWithBiometrics = useCallback(async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Entrar no SOS Gás",
      disableDeviceFallback: false,
    });
    if (result.success) {
      setStatus("authenticated");
      return true;
    }
    return false;
  }, []);

  const usePasswordInstead = useCallback(async () => {
    await logout();
  }, [logout]);

  const enableBiometric = useCallback(async (enabled: boolean) => {
    await setBiometricEnabled(enabled);
    await setAskedBiometric();
  }, []);

  const shouldOfferBiometric = useCallback(async () => {
    if (!biometricAvailable) return false;
    const [enabled, asked] = await Promise.all([isBiometricEnabled(), hasAskedBiometric()]);
    return !enabled && !asked;
  }, [biometricAvailable]);

  return (
    <AuthContext.Provider
      value={{
        status,
        user,
        biometricAvailable,
        login,
        logout,
        unlockWithBiometrics,
        usePasswordInstead,
        enableBiometric,
        shouldOfferBiometric,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de AuthProvider");
  return ctx;
}
