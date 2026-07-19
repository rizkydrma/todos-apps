/**
 * Staggered fade + slight rise untuk blok auth (title, form, CTA).
 * Reduced-motion → opacity saja, tanpa translate.
 */
import { useAppTheme } from '@/context/ThemeContext';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { springConfig } from '@/theme';
import { useEffect, type ReactNode } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export type AuthEntranceProps = {
  children: ReactNode;
  /** Delay ms sebelum animasi mulai (stagger antar blok). */
  delayMs?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Bungkus section auth agar masuk dengan spring halus dari bawah.
 */
export function AuthEntrance({
  children,
  delayMs = 0,
  style,
}: AuthEntranceProps) {
  const { theme } = useAppTheme();
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(reducedMotion ? 0 : 14);

  useEffect(() => {
    const spring = springConfig(theme.motion.spring.default);
    if (reducedMotion) {
      opacity.set(
        withDelay(
          delayMs,
          withTiming(1, { duration: theme.motion.duration.ui })
        )
      );
      return;
    }
    opacity.set(withDelay(delayMs, withSpring(1, spring)));
    translateY.set(withDelay(delayMs, withSpring(0, spring)));
  }, [delayMs, opacity, reducedMotion, theme.motion, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>
  );
}
