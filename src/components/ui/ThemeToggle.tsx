import { useAppTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { Pressable } from 'react-native';
import { AppText } from './AppText';

export type ThemeToggleProps = {
  variant?: 'text' | 'icon';
};

export function ThemeToggle({ variant = 'text' }: ThemeToggleProps) {
  const { isDarkMode, toggleTheme, theme } = useAppTheme();
  const styles = useThemedStyles((t) => ({
    text: {
      padding: t.spacing.sm,
      minHeight: t.size.touchMin,
      justifyContent: 'center' as const,
    },
    icon: {
      padding: 10,
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
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.full,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <AppText
          color="text"
          style={{ fontSize: theme.fontSize.md, fontWeight: '600' }}
        >
          {isDarkMode ? '☾' : '☀'}
        </AppText>
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
      <AppText variant="link" color="primary" style={{ fontWeight: '700' }}>
        {isDarkMode ? 'Light' : 'Dark'}
      </AppText>
    </Pressable>
  );
}
