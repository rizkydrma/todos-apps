/**
 * Theme context: system light/dark default + session-only override (ADR-0004).
 *
 * - theme: objek Theme (warna, spacing, typography, motion, dll)
 * - isDarkMode: mode ter-resolve
 * - override: null = ikuti system; light/dark = override sesi
 * - toggleTheme: flip override sesi (tidak di-persist)
 *
 * useThemedStyles / AppText / Button membaca theme lewat useAppTheme().
 */
import { darkTheme, lightTheme, type Theme } from '@/theme';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';

type ThemeOverride = 'light' | 'dark' | null;

type ThemeContextType = {
  theme: Theme;
  isDarkMode: boolean;
  /** null = mengikuti system appearance */
  override: ThemeOverride;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Provider tema — bungkus di root layout (di dalam SafeAreaProvider).
 * Default: OS color scheme. Toggle = override sesi sampai process death.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme(); // 'light' | 'dark' | null
  const [override, setOverride] = useState<ThemeOverride>(null);

  // Override menang; null system → fallback light bila scheme unknown
  const resolvedMode: 'light' | 'dark' =
    override ?? (systemScheme === 'dark' ? 'dark' : 'light');

  const toggleTheme = useCallback(() => {
    setOverride((prev) => {
      const current = prev ?? (systemScheme === 'dark' ? 'dark' : 'light');
      return current === 'dark' ? 'light' : 'dark';
    });
  }, [systemScheme]);

  const value = useMemo<ThemeContextType>(
    () => ({
      theme: resolvedMode === 'dark' ? darkTheme : lightTheme,
      isDarkMode: resolvedMode === 'dark',
      override,
      toggleTheme,
    }),
    [resolvedMode, override, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/**
 * Hook akses tema aktif. Harus di dalam ThemeProvider.
 * Contoh: const { theme, isDarkMode, toggleTheme } = useAppTheme();
 */
export function useAppTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useAppTheme harus digunakan di dalam ThemeProvider');
  }

  return context;
}
