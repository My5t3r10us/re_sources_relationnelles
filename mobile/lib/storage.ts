import { Platform } from 'react-native';

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
