/**
 * Theme context: system light/dark default + session-only override (ADR-0004).
 *
 * - theme / isDarkMode / override / toggleTheme (instant)
 * - requestInkToggle({x,y}): ink reveal ala rs-4/labs ink-toggle
 *   (screenshot → flip theme di bawah → tetesan + gelombang dstOut)
 * - statusBarIsDark: freeze style status bar selama ink animasi
 *
 * useThemedStyles / AppText / Button membaca theme lewat useAppTheme().
 */
import { darkTheme, lightTheme, type Theme } from '@/theme';
import {
  createContext,
  useCallback,
  useContext,
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
  /** Set override eksplisit (dipakai overlay setelah screenshot ready). */
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
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Provider tema — bungkus di root layout (di dalam SafeAreaProvider).
 * Default: OS color scheme. Toggle = override sesi sampai process death.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme(); // 'light' | 'dark' | null
  const [override, setOverride] = useState<ThemeOverride>(null);
  const [ink, setInk] = useState<ThemeInkState | null>(null);
  const inkLockRef = useRef(false);

  const resolvedMode: 'light' | 'dark' =
    override ?? (systemScheme === 'dark' ? 'dark' : 'light');

  const isDarkMode = resolvedMode === 'dark';

  const toggleTheme = useCallback(() => {
    setOverride((prev) => {
      const current = prev ?? (systemScheme === 'dark' ? 'dark' : 'light');
      return current === 'dark' ? 'light' : 'dark';
    });
  }, [systemScheme]);

  const setSessionMode = useCallback((mode: 'light' | 'dark') => {
    setOverride(mode);
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
        // Fallback: flip tanpa liquid reveal
        setOverride(nextDark ? 'dark' : 'light');
      }
    },
    [isDarkMode, toggleTheme]
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
