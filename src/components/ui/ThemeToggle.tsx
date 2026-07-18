/**
 * Tombol ganti light/dark mode (session override).
 * variant "text" → label Light/Dark (auth)
 * variant "icon" → SF Symbol sun/moon
 */
import { useAppTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { SymbolView } from 'expo-symbols';
import { Pressable } from 'react-native';
import { AppText } from './AppText';

export type ThemeToggleProps = {
  variant?: 'text' | 'icon';
};

/**
 * Toggle appearance sesi. Icon menampilkan mode yang akan diaktifkan.
 */
export function ThemeToggle({ variant = 'text' }: ThemeToggleProps) {
  const { isDarkMode, toggleTheme, theme } = useAppTheme();
  const styles = useThemedStyles((t) => ({
    text: {
      padding: t.spacing.sm,
      minHeight: t.size.touchMin,
      justifyContent: 'center' as const,
    },
    icon: {
      padding: t.spacing.sm,
      borderRadius: t.radius.full,
      borderWidth: 1,
      minWidth: t.size.touchMin,
      minHeight: t.size.touchMin,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
  }));

  if (variant === 'icon') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'
        }
        onPress={toggleTheme}
        style={({ pressed }) => [
          styles.icon,
          {
            backgroundColor: theme.colors.secondarySystemFill,
            borderColor: theme.colors.separator,
            opacity: pressed ? theme.motion.press.opacity : 1,
          },
        ]}
      >
        <SymbolView
          name={isDarkMode ? 'sun.max.fill' : 'moon.fill'}
          size={theme.fontSize.md}
          tintColor={theme.colors.label}
          fallback={
            <AppText color="label" style={{ fontSize: theme.fontSize.md }}>
              {isDarkMode ? '☀' : '☾'}
            </AppText>
          }
        />
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'
      }
      onPress={toggleTheme}
      hitSlop={8}
      style={({ pressed }) => [styles.text, { opacity: pressed ? 0.7 : 1 }]}
    >
      <AppText variant="link" color="primary">
        {isDarkMode ? 'Light' : 'Dark'}
      </AppText>
    </Pressable>
  );
}
