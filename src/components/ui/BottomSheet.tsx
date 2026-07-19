/**
 * Floating bottom sheet — tidak menempel edge (inset horizontal + bottom).
 *
 * Design (Emil + Apple):
 * - Occasional surface → spring enter, snappy exit
 * - Enter: opacity + translateY (bukan scale 0)
 * - Floating card: margin kiri/kanan/bawah + radius penuh continuous
 * - Reduced motion → opacity only
 */
import { useAppTheme } from '@/context/ThemeContext';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { springConfig } from '@/theme';
import { useEffect, type ReactNode } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Max height fraction of screen (default 0.86). */
  maxHeightRatio?: number;
  /**
   * Inset floating card dari tepi.
   * Default: horizontal md, bottom = safe area + sm (tidak nempel home indicator).
   */
  edgeInset?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Presentasi sheet mengambang dari bawah.
 */
export function BottomSheet({
  visible,
  onClose,
  children,
  maxHeightRatio = 0.86,
  edgeInset,
  style,
}: BottomSheetProps) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);

  const hInset = edgeInset ?? theme.spacing.md;
  // Bottom: gap di atas home indicator — sheet “duduk” di atas, bukan nempel
  const bottomInset =
    Math.max(insets.bottom, theme.spacing.sm) + theme.spacing.sm;

  const styles = useThemedStyles((t) => ({
    root: {
      flex: 1,
      justifyContent: 'flex-end' as const,
    },
    scrim: {
      ...StyleSheet.absoluteFill,
      backgroundColor: t.colors.overlay,
    },
    sheetWrap: {
      // Floating: gap kiri/kanan/bawah — tidak full-bleed
      marginHorizontal: hInset,
      marginBottom: bottomInset,
      maxHeight: windowHeight * maxHeightRatio - bottomInset,
      borderRadius: t.radius.xl + 8,
      // Shadow host di luar overflow clip
      ...PlatformShadow(t.colors.shadow),
    },
    sheet: {
      borderRadius: t.radius.xl + 8,
      overflow: 'hidden' as const,
      backgroundColor: t.colors.secondarySystemGroupedBackground,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.separator,
      maxHeight: '100%' as const,
    },
    grabberWrap: {
      alignItems: 'center' as const,
      paddingTop: t.spacing.sm + 2,
      paddingBottom: t.spacing.xs,
    },
    grabber: {
      width: 36,
      height: 5,
      borderRadius: 3,
      backgroundColor: t.colors.tertiaryLabel,
      opacity: 0.45,
    },
  }));

  useEffect(() => {
    if (visible) {
      // Drawer enter: ~280ms feel (Emil: modals 200–500ms, prefer snappy)
      progress.set(
        reducedMotion
          ? withTiming(1, { duration: theme.motion.duration.ui })
          : withSpring(1, springConfig(theme.motion.spring.default))
      );
    } else {
      progress.set(0);
    }
  }, [visible, reducedMotion, progress, theme.motion]);

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const sheetStyle = useAnimatedStyle(() => {
    if (reducedMotion) {
      return { opacity: progress.value };
    }
    // Enter from slightly below + fade — never scale(0)
    return {
      opacity: progress.value,
      transform: [
        { translateY: (1 - progress.value) * 40 },
        { scale: 0.96 + progress.value * 0.04 },
      ],
    };
  });

  const requestClose = () => {
    // Exit faster than enter (asymmetric)
    if (reducedMotion) {
      progress.set(
        withTiming(0, { duration: theme.motion.duration.fast }, (done) => {
          if (done) runOnJS(onClose)();
        })
      );
      return;
    }
    progress.set(
      withSpring(0, springConfig(theme.motion.spring.snappy), (done) => {
        if (done) runOnJS(onClose)();
      })
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={requestClose}
    >
      <View style={styles.root} pointerEvents="box-none">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tutup"
          style={StyleSheet.absoluteFill}
          onPress={requestClose}
        >
          <Animated.View style={[styles.scrim, scrimStyle]} />
        </Pressable>

        <Animated.View style={[styles.sheetWrap, sheetStyle]}>
          <View style={[styles.sheet, style]}>
            <View style={styles.grabberWrap}>
              <View style={styles.grabber} />
            </View>
            {children}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

/** Soft float shadow — host di luar overflow:hidden sheet. */
function PlatformShadow(shadowColor: string): ViewStyle {
  return {
    shadowColor,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 16,
  };
}
