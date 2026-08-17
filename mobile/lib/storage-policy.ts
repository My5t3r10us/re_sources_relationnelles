export interface SecureStorageAdapter {
  setItemAsync(key: string, value: string): Promise<void>;
  getItemAsync(key: string): Promise<string | null>;
  deleteItemAsync(key: string): Promise<void>;
}

export async function persistValue(store: SecureStorageAdapter | null, key: string, value: string) {
  if (store) await store.setItemAsync(key, value);
}

export async function readPersistedValue(store: SecureStorageAdapter | null, key: string) {
  return store ? store.getItemAsync(key) : null;
}

export async function deletePersistedValue(store: SecureStorageAdapter | null, key: string) {
  if (store) await store.deleteItemAsync(key);
}
