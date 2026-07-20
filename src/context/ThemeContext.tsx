/**
 * Theme context: system light/dark default + persisted override.
 *
 * - Default: OS color scheme (useColorScheme)
 * - Toggle / ink flip: override light|dark, disimpan AsyncStorage
 * - Restart: hydrate preferensi dulu (paralllel splash auth) agar tidak “reset”
 * - theme / isDarkMode / override / toggleTheme (instant)
 * - requestInkToggle({x,y}): ink reveal (screenshot → flip → gelombang)
 * - statusBarIsDark: freeze style status bar selama ink animasi
 *
 * useThemedStyles / AppText / Button membaca theme lewat useAppTheme().
 */
import {
  clearThemePreference,
  loadThemePreference,
  saveThemePreference,
} from '@/lib/theme-preference';
import { darkTheme, lightTheme, type Theme } from '@/theme';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Platform, useColorScheme } from 'react-native';
import { captureScreen } from 'react-native-view-shot';

type ThemeOverride = 'light' | 'dark' | null;

/** Titik asal tetesan (window coords), biasanya bawah ikon toggle. */
export type InkOrigin = {
  x: number;
  y: number;
};

/** State ink reveal yang dikonsumsi ThemeInkOverlay di root. */
export type ThemeInkState = {
  shotUri: string;
  originX: number;
  originY: number;
  /** Mode target setelah flip di bawah screenshot. */
  nextDark: boolean;
  /** Mode status bar lama (freeze sampai overlay selesai). */
  frozenDark: boolean;
};

type ThemeContextType = {
  theme: Theme;
  isDarkMode: boolean;
  /** null = mengikuti system appearance */
  override: ThemeOverride;
  /** Flip tema instan (tanpa ink). */
  toggleTheme: () => void;
  /** Set override eksplisit + persist (dipakai ink overlay setelah screenshot ready). */
  setSessionMode: (mode: 'light' | 'dark') => void;
  /**
   * Mulai ink reveal dari origin (window). No-op jika sudah animating.
   * Fallback ke toggle instan bila screenshot gagal / web / reduced path.
   */
  requestInkToggle: (origin: InkOrigin) => Promise<void>;
  /** true saat ink overlay aktif (blok double-tap). */
  isInkAnimating: boolean;
  /** Payload untuk ThemeInkOverlay; null = idle. */
  ink: ThemeInkState | null;
  /** Selesai animasi — unmount overlay. */
  endInkTransition: () => void;
  /**
   * Status bar style: pakai frozenDark selama ink agar tidak flash
   * sebelum gelombang menutupi (system UI tidak ikut screenshot).
   */
  statusBarIsDark: boolean;
  /**
   * Kembalikan ke system appearance + hapus preferensi tersimpan.
   * Belum diikat ke UI; siap untuk settings “Match system”.
   */
  clearOverride: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Provider tema — bungkus di root layout (di dalam SafeAreaProvider).
 * Default: OS color scheme. Toggle = override yang di-persist ke AsyncStorage.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme(); // 'light' | 'dark' | null
  const [override, setOverride] = useState<ThemeOverride>(null);
  const [ink, setInk] = useState<ThemeInkState | null>(null);
  const inkLockRef = useRef(false);

  // Hydrate preferensi tersimpan sekali saat mount (sebelum splash hide = auth bootstrap).
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const saved = await loadThemePreference();
      if (!cancelled && saved) {
        setOverride(saved);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const resolvedMode: 'light' | 'dark' =
    override ?? (systemScheme === 'dark' ? 'dark' : 'light');

  const isDarkMode = resolvedMode === 'dark';

  /**
   * Terapkan override + persist. Satu jalur untuk toggle, ink, dan fallback.
   */
  const applyOverride = useCallback((mode: 'light' | 'dark') => {
    setOverride(mode);
    void saveThemePreference(mode);
  }, []);

  const toggleTheme = useCallback(() => {
    const current = override ?? (systemScheme === 'dark' ? 'dark' : 'light');
    applyOverride(current === 'dark' ? 'light' : 'dark');
  }, [override, systemScheme, applyOverride]);

  const setSessionMode = useCallback(
    (mode: 'light' | 'dark') => {
      applyOverride(mode);
    },
    [applyOverride]
  );

  const clearOverride = useCallback(() => {
    setOverride(null);
    void clearThemePreference();
  }, []);

  const endInkTransition = useCallback(() => {
    inkLockRef.current = false;
    setInk(null);
  }, []);

  const requestInkToggle = useCallback(
    async (origin: InkOrigin) => {
      if (inkLockRef.current) return;
      // Web / view-shot terbatas → flip instan
      if (Platform.OS === 'web') {
        toggleTheme();
        return;
      }

      inkLockRef.current = true;
      const frozenDark = isDarkMode;
      const nextDark = !isDarkMode;

      try {
        const uri = await captureScreen({
          format: 'jpg',
          quality: 0.9,
          result: 'tmpfile',
        });
        const shotUri = uri.startsWith('file://') ? uri : `file://${uri}`;
        setInk({
          shotUri,
          originX: origin.x,
          originY: origin.y,
          nextDark,
          frozenDark,
        });
      } catch {
        inkLockRef.current = false;
        // Fallback: flip tanpa liquid reveal (tetap persist)
        applyOverride(nextDark ? 'dark' : 'light');
      }
    },
    [isDarkMode, toggleTheme, applyOverride]
  );

  const statusBarIsDark = ink?.frozenDark ?? isDarkMode;

  const value = useMemo<ThemeContextType>(
    () => ({
      theme: isDarkMode ? darkTheme : lightTheme,
      isDarkMode,
      override,
      toggleTheme,
      setSessionMode,
      requestInkToggle,
      isInkAnimating: ink != null,
      ink,
      endInkTransition,
      statusBarIsDark,
      clearOverride,
    }),
    [
      isDarkMode,
      override,
      toggleTheme,
      setSessionMode,
      requestInkToggle,
      ink,
      endInkTransition,
      statusBarIsDark,
      clearOverride,
    ]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/**
 * Hook akses tema aktif. Harus di dalam ThemeProvider.
 */
export function useAppTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useAppTheme harus digunakan di dalam ThemeProvider');
  }

  return context;
}
