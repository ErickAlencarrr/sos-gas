import * as SecureStore from "expo-secure-store";
import { User } from "../types";

const TOKEN_KEY = "sosgas_token";
const USER_KEY = "sosgas_user";
const BIOMETRIC_KEY = "sosgas_biometric_enabled";
const BIOMETRIC_ASKED_KEY = "sosgas_biometric_asked";

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getStoredUser(): Promise<User | null> {
  const raw = await SecureStore.getItemAsync(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export async function setStoredUser(user: User): Promise<void> {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}

export async function isBiometricEnabled(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(BIOMETRIC_KEY);
  return value === "1";
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  if (enabled) {
    await SecureStore.setItemAsync(BIOMETRIC_KEY, "1");
  } else {
    await SecureStore.deleteItemAsync(BIOMETRIC_KEY);
  }
}

export async function hasAskedBiometric(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(BIOMETRIC_ASKED_KEY);
  return value === "1";
}

export async function setAskedBiometric(): Promise<void> {
  await SecureStore.setItemAsync(BIOMETRIC_ASKED_KEY, "1");
}
