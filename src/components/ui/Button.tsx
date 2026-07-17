import { useAppTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  ViewStyle,
} from 'react-native';
import { AppText } from './AppText';

export type ButtonVariant = 'primary' | 'ghost' | 'danger';

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
  style?: ViewStyle | ViewStyle[];
};

export function Button({
  title,
  variant = 'primary',
  disabled,
  loading = false,
  onPress,
  style,
  ...rest
}: ButtonProps) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles((t) => ({
    base: {
      paddingVertical: t.spacing.md,
      paddingHorizontal: t.spacing.lg,
      borderRadius: t.radius.sm,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      minHeight: t.size.controlHeight,
    },
    ghost: {
      backgroundColor: 'transparent',
      paddingVertical: t.spacing.sm,
    },
  }));

  const isDisabled = Boolean(disabled || loading);

  const backgroundColor = (() => {
    if (variant === 'ghost') return 'transparent';
    if (variant === 'danger') return theme.colors.error;
    if (isDisabled) return theme.colors.primaryDisabled;
    return theme.colors.primary;
  })();

  const textColor =
    variant === 'ghost'
      ? 'primary'
      : variant === 'danger'
        ? 'onPrimary'
        : 'onPrimary';

  const elevationStyle =
    variant === 'primary' && !isDisabled
      ? theme.elevation('sm', theme.colors.shadow)
      : undefined;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === 'ghost' && styles.ghost,
        {
          backgroundColor,
          opacity: pressed && !isDisabled ? 0.9 : 1,
        },
        elevationStyle,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.onPrimary} />
      ) : (
        <AppText variant="label" color={textColor}>
          {title}
        </AppText>
      )}
    </Pressable>
  );
}
