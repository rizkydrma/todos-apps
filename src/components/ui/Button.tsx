/**
 * Tombol HIG (filled / tinted / gray / plain / destructive).
 *
 * - loading: spinner, nonaktifkan press
 * - Press: scale spring (Reanimated); reduced-motion → opacity saja
 * - Continuous radius (lg), bukan pill X-style
 */
import { useAppTheme } from '@/context/ThemeContext';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { springConfig } from '@/theme';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  View,
  type PressableProps,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { AppText } from './AppText';

export type ButtonVariant =
  'filled' | 'tinted' | 'gray' | 'plain' | 'destructive';

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  title: string;
  variant?: ButtonVariant;
  /** True = spinner di dalam tombol, tidak bisa ditekan. */
  loading?: boolean;
  /** Ikon kiri (mis. GoogleLogo) di samping title. */
  leftIcon?: ReactNode;
  style?: ViewStyle | ViewStyle[];
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Pressable HIG. Pakai title string, bukan children bebas.
 */
export function Button({
  title,
  variant = 'filled',
  disabled,
  loading = false,
  leftIcon,
  onPress,
  style,
  ...rest
}: ButtonProps) {
  const { theme } = useAppTheme();
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const pressOpacity = useSharedValue(1);

  const styles = useThemedStyles((t) => ({
    base: {
      paddingVertical: t.spacing.sm + 2,
      paddingHorizontal: t.spacing.lg,
      borderRadius: t.radius.lg,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      minHeight: t.size.controlHeight,
      flexDirection: 'row' as const,
      gap: t.spacing.sm,
    },
    plain: {
      backgroundColor: 'transparent',
      paddingVertical: t.spacing.sm,
    },
  }));

  const isDisabled = Boolean(disabled || loading);

  const backgroundColor = (() => {
    if (variant === 'plain') return 'transparent';
    if (variant === 'tinted') return theme.colors.secondarySystemFill;
    if (variant === 'gray') return theme.colors.tertiarySystemFill;
    if (variant === 'destructive') return theme.colors.destructive;
    if (isDisabled) return theme.colors.primaryDisabled;
    return theme.colors.primary;
  })();

  const textColor = (() => {
    if (variant === 'plain' || variant === 'tinted') return 'primary' as const;
    if (variant === 'gray') return 'label' as const;
    return 'onPrimary' as const;
  })();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: pressOpacity.value,
  }));

  const spring = springConfig(theme.motion.spring.snappy);
  const pressScale = theme.motion.press.scale;
  const pressOpacityTarget = theme.motion.press.opacity;
  const fastMs = theme.motion.duration.fast;

  const handlePressIn = () => {
    if (isDisabled) return;
    if (reducedMotion) {
      // Reanimated shared values — mutasi .value sengaja (bukan React state)
      pressOpacity.set(withTiming(pressOpacityTarget, { duration: fastMs }));
      return;
    }
    scale.set(withSpring(pressScale, spring));
  };

  const handlePressOut = () => {
    if (reducedMotion) {
      pressOpacity.set(withTiming(1, { duration: fastMs }));
      return;
    }
    scale.set(withSpring(1, spring));
  };

  const spinnerColor =
    variant === 'plain' || variant === 'tinted' || variant === 'gray'
      ? theme.colors.primary
      : theme.colors.onPrimary;

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.base,
        variant === 'plain' && styles.plain,
        { backgroundColor },
        animatedStyle,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <>
          {leftIcon ? <View>{leftIcon}</View> : null}
          <AppText variant="label" color={textColor}>
            {title}
          </AppText>
        </>
      )}
    </AnimatedPressable>
  );
}
