import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  HISTORY: '@nutriscan/history',
  FAVORITES: '@nutriscan/favorites',
  PREFERENCES: '@nutriscan/preferences',
  THEME: '@nutriscan/theme',
};

export async function saveToHistory(product: any): Promise<void> {
  try {
    const existing = await getHistory();
    const entry = { ...product, scannedAt: new Date().toISOString() };
    const updated = [entry, ...existing.filter((p: any) => p.code !== product.code)].slice(0, 100);
    await AsyncStorage.setItem(KEYS.HISTORY, JSON.stringify(updated));
  } catch {}
}

export async function getHistory(): Promise<any[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function deleteFromHistory(code: string): Promise<void> {
  const existing = await getHistory();
  await AsyncStorage.setItem(KEYS.HISTORY, JSON.stringify(existing.filter((p: any) => p.code !== code)));
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.HISTORY);
}

export async function saveFavorite(product: any, category = 'Sans catégorie'): Promise<void> {
  try {
    const existing = await getFavorites();
    const entry = { ...product, category, savedAt: new Date().toISOString() };
    const updated = [...existing.filter((f: any) => f.code !== product.code), entry];
    await AsyncStorage.setItem(KEYS.FAVORITES, JSON.stringify(updated));
  } catch {}
}

export async function getFavorites(): Promise<any[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.FAVORITES);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function removeFavorite(code: string): Promise<void> {
  const existing = await getFavorites();
  await AsyncStorage.setItem(KEYS.FAVORITES, JSON.stringify(existing.filter((f: any) => f.code !== code)));
}

export async function isFavorite(code: string): Promise<boolean> {
  const favorites = await getFavorites();
  return favorites.some((f: any) => f.code === code);
}

export async function deleteCategory(categoryName: string): Promise<void> {
  const favorites = await getFavorites();
  await AsyncStorage.setItem(KEYS.FAVORITES, JSON.stringify(favorites.filter((f: any) => f.category !== categoryName)));
}

export async function getPreferences(): Promise<{ allergens: string[]; diets: string[] }> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.PREFERENCES);
    return raw ? JSON.parse(raw) : { allergens: [], diets: [] };
  } catch { return { allergens: [], diets: [] }; }
}

export async function savePreferences(prefs: { allergens: string[]; diets: string[] }): Promise<void> {
  await AsyncStorage.setItem(KEYS.PREFERENCES, JSON.stringify(prefs));
}

export async function getTheme(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.THEME);
    return raw ? JSON.parse(raw) : false;
  } catch { return false; }
}

export async function saveTheme(isDark: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.THEME, JSON.stringify(isDark));
}

export async function resetAllData(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}
