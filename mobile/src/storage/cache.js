import AsyncStorage from '@react-native-async-storage/async-storage';

// Non-sensitive offline cache of the last fetched lists (per user), so tasks can be viewed without a network.
const prefix = (userId) => `taskorbit.cache.${userId}.`;

export async function cacheSet(userId, key, data) {
  try { await AsyncStorage.setItem(prefix(userId) + key, JSON.stringify({ at: Date.now(), data })); } catch { /* cache is best-effort */ }
}
export async function cacheGet(userId, key) {
  try {
    const raw = await AsyncStorage.getItem(prefix(userId) + key);
    return raw ? JSON.parse(raw).data : null;
  } catch { return null; }
}
export async function cacheClear() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove(keys.filter((k) => k.startsWith('taskorbit.cache.')));
  } catch { /* ignore */ }
}
