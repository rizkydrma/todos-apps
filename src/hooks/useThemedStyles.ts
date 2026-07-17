/**
 * Hook: bangun StyleSheet dari theme aktif (light/dark).
 *
 * Kenapa pakai ini?
 * - Style recompute hanya saat objek theme berubah (toggle light/dark)
 * - Factory harus pure function dari `theme` (jangan tutup state lain di dalam factory)
 *
 * Contoh:
 *   const styles = useThemedStyles((t) => ({
 *     box: { padding: t.spacing.md, backgroundColor: t.colors.surface },
 *   }));
 */
import { useAppTheme } from '@/context/ThemeContext';
import type { Theme } from '@/theme';
import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

type NamedStyles<T> = StyleSheet.NamedStyles<T>;

/**
 * @param factory - fungsi (theme) => object style; harus pure
 * @returns StyleSheet yang sudah di-create, siap dipakai di style={}
 */
export function useThemedStyles<T extends NamedStyles<T> | NamedStyles<any>>(
  factory: (theme: Theme) => T
): T {
  const { theme } = useAppTheme();

  return useMemo(() => {
    return StyleSheet.create(factory(theme));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pure factory of theme only
  }, [theme]);
}
