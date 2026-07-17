import { useAppTheme } from '@/context/ThemeContext';
import type { Theme } from '@/theme';
import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

type NamedStyles<T> = StyleSheet.NamedStyles<T>;

/**
 * Build StyleSheet styles from the active theme.
 * Factories must be pure functions of `theme`.
 * Styles recompute only when the theme object changes (light/dark toggle).
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
