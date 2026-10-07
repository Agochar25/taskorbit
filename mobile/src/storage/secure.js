import * as SecureStore from 'expo-secure-store';

// Tokens live in the Android Keystore / iOS Keychain via expo-secure-store - never in AsyncStorage.
const KEY = 'taskorbit.session';

export const saveSession = (session) => SecureStore.setItemAsync(KEY, JSON.stringify(session));
export const clearSession = () => SecureStore.deleteItemAsync(KEY);
export async function loadSession() {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
