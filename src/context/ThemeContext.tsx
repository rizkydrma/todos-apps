/**
 * Context tema light/dark untuk seluruh app.
 *
 * - isDarkMode: boolean mode aktif
 * - theme: objek Theme (warna, spacing, typography, dll)
 * - toggleTheme: bolak-balik light ↔ dark
 *
 * Default saat ini: dark mode.
 * useThemedStyles / AppText / Button membaca theme lewat useAppTheme().
 */
import { darkTheme, lightTheme, type Theme } from '@/theme';
import { createContext, useContext, useMemo, useState } from 'react';

type ThemeContextType = {
  isDarkMode: boolean;
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Provider tema — bungkus di root layout (di dalam SafeAreaProvider).
 * State isDarkMode di-hold di sini; value di-memo agar consumer tidak re-render sia-sia.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // true = dark (default app)
  const [isDarkMode, setIsDarkMode] = useState(true);

  const value = useMemo<ThemeContextType>(
    () => ({
      isDarkMode,
      theme: isDarkMode ? darkTheme : lightTheme,
      toggleTheme: () => setIsDarkMode((prev) => !prev),
    }),
    [isDarkMode]
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
