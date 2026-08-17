import { Platform } from 'react-native';
import { deletePersistedValue, persistValue, readPersistedValue } from './storage-policy';

/**
 * La cible Expo web conserve l'authentification uniquement dans le store
 * Zustand en mémoire. La session n'y survit donc pas à un rechargement, ce qui
 * est un compromis adapté à cette cible de développement et de débogage. Sur
 * iOS et Android, les données restent chiffrées par `expo-secure-store`.
 */

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

async function getSecureStore() {
  if (Platform.OS !== 'web') {
    return await import('expo-secure-store');
  }
  return null;
}

export async function saveToken(token: string): Promise<void> {
  const store = await getSecureStore();
  await persistValue(store, TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  const store = await getSecureStore();
  return readPersistedValue(store, TOKEN_KEY);
}

export async function deleteToken(): Promise<void> {
  const store = await getSecureStore();
  await deletePersistedValue(store, TOKEN_KEY);
}

export async function saveUser(user: object): Promise<void> {
  const json = JSON.stringify(user);
  const store = await getSecureStore();
  await persistValue(store, USER_KEY, json);
}

export async function getUser<T>(): Promise<T | null> {
  const store = await getSecureStore();
  const json = await readPersistedValue(store, USER_KEY);
  if (!json) return null;
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export async function deleteUser(): Promise<void> {
  const store = await getSecureStore();
  await deletePersistedValue(store, USER_KEY);
}
