/**
 * Toggle light/dark (persisted override) + ink reveal.
 *
 * - variant "icon" (default): chip sun/moon
 * - variant "text": pill label + ikon
 * - Tap → measureInWindow → requestInkToggle (tetasan malam/siang)
 * - reduced-motion / ink busy → toggle instan
 * - Preferensi disimpan AsyncStorage lewat ThemeContext (survive restart)
 */
import { useAppTheme } from '@/context/ThemeContext';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { springConfig } from '@/theme';
import { Moon, Sun } from 'lucide-react-native';
import { useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { AppText } from './AppText';

export type ThemeToggleProps = {
  /** icon = chip bulat; text = pill label + ikon. Default icon. */
  variant?: 'text' | 'icon';
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Toggle appearance. Ikon = mode target (moon → dark, sun → light).
 * Ink drip dimulai dari bawah glyph.
 */
export function ThemeToggle({ variant = 'icon' }: ThemeToggleProps) {
  const { isDarkMode, theme, toggleTheme, requestInkToggle, isInkAnimating } =
    useAppTheme();
  const reducedMotion = useReducedMotion();
  const iconRef = useRef<View>(null);
  const scale = useSharedValue(1);
  const pressOpacity = useSharedValue(1);

  const styles = useThemedStyles((t) => ({
    icon: {
      width: t.size.touchMin,
      height: t.size.touchMin,
      borderRadius: t.radius.full,
      borderWidth: StyleSheet.hairlineWidth,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    textPill: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.xs,
      paddingVertical: t.spacing.sm,
      paddingHorizontal: t.spacing.md,
      minHeight: t.size.touchMin,
      borderRadius: t.radius.full,
      borderWidth: StyleSheet.hairlineWidth,
    },
  }));

  const spring = springConfig(theme.motion.spring.snappy);
  const pressScale = theme.motion.press.scale;
  const fastMs = theme.motion.duration.fast;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: pressOpacity.value,
  }));

  const handlePressIn = () => {
    if (reducedMotion) {
      pressOpacity.set(
        withTiming(theme.motion.press.opacity, { duration: fastMs })
      );
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

  const onPress = () => {
    if (isInkAnimating) return;

    // Micro bounce on glyph (ink-toggle style)
    if (!reducedMotion) {
      scale.set(
        withSequence(
          withTiming(0.8, { duration: 100 }),
          withSpring(1, { damping: 12, stiffness: 260 })
        )
      );
    }

    if (reducedMotion) {
      toggleTheme();
      return;
    }

    // Origin drip: pusat horizontal, sedikit di bawah glyph
    iconRef.current?.measureInWindow((x, y, w, h) => {
      void requestInkToggle({
        x: x + w / 2,
        y: y + h / 2 + 28,
      });
    });
  };

  const iconColor = theme.colors.label;
  const NextIcon = isDarkMode ? Sun : Moon;
  const a11yLabel = isDarkMode ? 'Switch to light mode' : 'Switch to dark mode';

  const surface = {
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.05)',
    borderColor: isDarkMode ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)',
  };

  const content =
    variant === 'text' ? (
      <>
        <NextIcon size={16} color={iconColor} strokeWidth={2.2} />
        <AppText variant="caption" color="label" style={{ fontWeight: '600' }}>
          {isDarkMode ? 'Light' : 'Dark'}
        </AppText>
      </>
    ) : (
      <NextIcon size={20} color={iconColor} strokeWidth={2.2} />
    );

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityState={{ busy: isInkAnimating }}
      disabled={isInkAnimating}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      hitSlop={4}
      style={[
        variant === 'text' ? styles.textPill : styles.icon,
        surface,
        animatedStyle,
      ]}
    >
      {/* measure target — View biasa di dalam pressable */}
      <View ref={iconRef} collapsable={false}>
        {content}
      </View>
    </AnimatedPressable>
  );
}
