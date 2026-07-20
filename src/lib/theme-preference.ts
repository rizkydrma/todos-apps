/**
 * Persist preferensi theme light/dark (bukan secret → AsyncStorage).
 *
 * Dipakai ThemeContext: hydrate saat boot, tulis saat user toggle.
 * null di storage = ikuti system appearance (belum pernah override).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Key AsyncStorage — jangan diganti sembarangan (preferensi lama hilang). */
const STORAGE_KEY = 'appearance.override';

export type ThemePreference = 'light' | 'dark';

/**
 * Baca override tersimpan. Return null jika belum ada / corrupt / error.
 * Dipanggil sekali saat ThemeProvider mount.
 */
export async function loadThemePreference(): Promise<ThemePreference | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw === 'light' || raw === 'dark') {
      return raw;
    }
    return null;
  } catch {
    // Storage gagal (web edge / disk) → anggap belum ada preferensi
    return null;
  }
}

/**
 * Simpan override eksplisit (setelah toggle / ink flip).
 * Fail soft: UI tetap update lewat state; preferensi mungkin hilang di restart.
 */
export async function saveThemePreference(
  mode: ThemePreference
): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // ignore — non-critical
  }
}

/**
 * Hapus override → app kembali ikuti system (belum dipakai UI, siap API).
 */
export async function clearThemePreference(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
