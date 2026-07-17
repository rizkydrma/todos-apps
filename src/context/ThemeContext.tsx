import { darkTheme, lightTheme, type Theme } from '@/theme';
import { createContext, useContext, useMemo, useState } from 'react';

type ThemeContextType = {
  isDarkMode: boolean;
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
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

export function useAppTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useAppTheme harus digunakan di dalam ThemeProvider');
  }

  return context;
}
