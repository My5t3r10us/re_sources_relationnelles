import { describe, expect, it, vi } from "vitest";
import {
  deletePersistedValue,
  persistValue,
  readPersistedValue,
  type SecureStorageAdapter,
} from "../../../mobile/lib/storage-policy";

describe("politique de stockage mobile", () => {
  it("ne persiste rien lorsque la cible web ne fournit aucun stockage sécurisé", async () => {
    const localStorageSet = vi.fn();
    Object.defineProperty(globalThis, "localStorage", {
      value: { setItem: localStorageSet },
      configurable: true,
    });

    await persistValue(null, "auth_token", "secret-token");

    expect(await readPersistedValue(null, "auth_token")).toBeNull();
    expect(localStorageSet).not.toHaveBeenCalled();
  });

  it("respecte le contrat expo-secure-store sur une cible native", async () => {
    const store: SecureStorageAdapter = {
      setItemAsync: vi.fn().mockResolvedValue(undefined),
      getItemAsync: vi.fn().mockResolvedValue("native-token"),
      deleteItemAsync: vi.fn().mockResolvedValue(undefined),
    };

    await persistValue(store, "auth_token", "native-token");
    expect(store.setItemAsync).toHaveBeenCalledWith("auth_token", "native-token");
    expect(await readPersistedValue(store, "auth_token")).toBe("native-token");
    await deletePersistedValue(store, "auth_token");
    expect(store.deleteItemAsync).toHaveBeenCalledWith("auth_token");
  });
});
