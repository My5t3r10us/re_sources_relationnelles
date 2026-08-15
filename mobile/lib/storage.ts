import { Platform } from 'react-native';

/**
 * ⚠️ Repli web : le jeton est écrit en `localStorage`, accessible à tout
 * script de la page. Sur la cible Expo web, une XSS permettrait donc de
 * l'exfiltrer. Sur iOS et Android, `expo-secure-store` est utilisé et ce
 * problème ne se pose pas.
 *
 * Correction attendue : sur web, s'appuyer sur le cookie de session
 * `httpOnly` posé par better-auth (fetch avec `credentials: "include"`) au
 * lieu de conserver un jeton porteur côté client. Ce changement touche le
 * flux d'authentification mobile et n'a pas pu être validé faute de runtime
 * Expo dans l'environnement de correction — il est laissé en l'état plutôt
 * que livré non testé.
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
  if (store) {
    await store.setItemAsync(TOKEN_KEY, token);
  } else {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export async function getToken(): Promise<string | null> {
  const store = await getSecureStore();
  if (store) {
    return store.getItemAsync(TOKEN_KEY);
  }
  return localStorage.getItem(TOKEN_KEY);
}

export async function deleteToken(): Promise<void> {
  const store = await getSecureStore();
  if (store) {
    await store.deleteItemAsync(TOKEN_KEY);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export async function saveUser(user: object): Promise<void> {
  const json = JSON.stringify(user);
  const store = await getSecureStore();
  if (store) {
    await store.setItemAsync(USER_KEY, json);
  } else {
    localStorage.setItem(USER_KEY, json);
  }
}

export async function getUser<T>(): Promise<T | null> {
  const store = await getSecureStore();
  let json: string | null;
  if (store) {
    json = await store.getItemAsync(USER_KEY);
  } else {
    json = localStorage.getItem(USER_KEY);
  }
  if (!json) return null;
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export async function deleteUser(): Promise<void> {
  const store = await getSecureStore();
  if (store) {
    await store.deleteItemAsync(USER_KEY);
  } else {
    localStorage.removeItem(USER_KEY);
  }
}
