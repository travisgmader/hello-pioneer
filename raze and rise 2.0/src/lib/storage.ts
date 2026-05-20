/**
 * MMKV + SecureStore hybrid storage
 *
 * Pattern: SecureStore holds only the MMKV encryption key (UUID, well under 2048 bytes).
 * MMKV stores the Supabase session (JWT exceeds SecureStore's 2048-byte limit).
 *
 * T-01b-I-01 mitigation: MMKV is AES-encrypted; key stored in Keychain/Keystore with
 * AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY accessibility — most restrictive option that still
 * allows background task access after the user has unlocked the device once.
 */

import { createMMKV, type MMKV } from 'react-native-mmkv';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const ENCRYPTION_KEY_NAME = 'mmkv.encryption.key';

/**
 * Retrieves the MMKV encryption key from SecureStore, creating and storing a new
 * UUID key if one does not exist yet. Uses AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY
 * (T-01b-I-01 mitigation) so the key is never accessible before first unlock.
 */
async function getOrCreateEncryptionKey(): Promise<string> {
  let key = await SecureStore.getItemAsync(ENCRYPTION_KEY_NAME);
  if (!key) {
    key = Crypto.randomUUID();
    await SecureStore.setItemAsync(ENCRYPTION_KEY_NAME, key, {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
    });
  }
  return key;
}

let storageInstance: MMKV | null = null;

/**
 * Initializes the encrypted MMKV instance. MUST be awaited at app startup
 * before the Supabase client is created (the Supabase client reads from MMKV
 * via supabaseStorageAdapter the moment it is instantiated).
 */
export async function initStorage(): Promise<MMKV> {
  if (storageInstance) return storageInstance;
  const encryptionKey = await getOrCreateEncryptionKey();
  storageInstance = createMMKV({ id: 'razeandrise.session', encryptionKey });
  return storageInstance;
}

/**
 * Returns the initialized MMKV instance. Throws if called before initStorage().
 */
export function getStorage(): MMKV {
  if (!storageInstance) {
    throw new Error('Storage not initialized — call initStorage() first');
  }
  return storageInstance;
}

/**
 * Storage adapter that Supabase createClient expects in auth.storage.
 * Shape: { getItem, setItem, removeItem }
 *
 * getItem must return null (not undefined) when the key is absent — the Supabase
 * auth library treats undefined as an unexpected value and falls back to an
 * in-memory session, breaking persistence.
 */
export const supabaseStorageAdapter = {
  getItem: (key: string): string | null => getStorage().getString(key) ?? null,
  setItem: (key: string, value: string): void => getStorage().set(key, value),
  removeItem: (key: string): void => { getStorage().remove(key); },
};
