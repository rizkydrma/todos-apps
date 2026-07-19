/**
 * Host dialog konfirmasi destruktif (Emil design-eng + HIG).
 *
 * Mount sekali di root (seperti ToastHost). Data dari `lib/confirm`.
 *
 * Design decisions:
 * - Occasional modal → animasi standard (spring), bukan zero-motion
 * - Modal centered: scale 0.95→1 + opacity (bukan scale 0)
 * - Exit lebih cepat dari enter (asymmetric)
 * - Floating card: inset horizontal, radius continuous, soft shadow
 * - 2 aksi bersebelahan: cancel gray | confirm destructive (flex row)
 * - Press scale via Button (sudah spring 0.97)
 * - Reduced motion → opacity only
 */
import { useAppTheme } from '@/context/ThemeContext';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import {
  resolveConfirm,
  subscribeConfirm,
  type ConfirmRequest,
} from '@/lib/confirm';
import { hapticCommit } from '@/lib/haptics';
import { springConfig } from '@/theme';
import { AlertTriangle, Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from './AppText';
import { Button } from './Button';

/**
 * Render dialog di atas navigasi saat confirmDestructive dipanggil.
 */
export function ConfirmDialogHost() {
  const { theme, isDarkMode } = useAppTheme();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  /** Request yang masih di-paint saat exit animation */
  const [display, setDisplay] = useState<ConfirmRequest | null>(null);

  const progress = useSharedValue(0);

  const styles = useThemedStyles((t) => ({
    root: {
      flex: 1,
      justifyContent: 'center' as const,
      paddingHorizontal: t.spacing.lg,
      paddingTop: insets.top + t.spacing.md,
      paddingBottom: insets.bottom + t.spacing.md,
    },
    scrim: {
      ...StyleSheet.absoluteFill,
      backgroundColor: t.colors.overlay,
    },
    card: {
      borderRadius: t.radius.xl + 4,
      backgroundColor: t.colors.secondarySystemGroupedBackground,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.separator,
      paddingTop: t.spacing.xl,
      paddingBottom: t.spacing.lg,
      paddingHorizontal: t.spacing.lg,
      // Soft float
      shadowColor: t.colors.shadow,
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: isDarkMode ? 0.45 : 0.16,
      shadowRadius: 32,
      elevation: 18,
      maxWidth: 400,
      width: '100%' as const,
      alignSelf: 'center' as const,
    },
    iconWrap: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      alignSelf: 'center' as const,
      marginBottom: t.spacing.md,
      backgroundColor: t.colors.destructive + '1A', // ~10% tint
    },
    title: {
      textAlign: 'center' as const,
      marginBottom: t.spacing.sm,
    },
    message: {
      textAlign: 'center' as const,
      marginBottom: t.spacing.lg,
      lineHeight: 22,
    },
    actions: {
      flexDirection: 'row' as const,
      gap: t.spacing.sm,
    },
    actionBtn: {
      flex: 1,
    },
  }));

  useEffect(() => {
    return subscribeConfirm((next) => {
      setRequest(next);
      if (next) {
        setDisplay(next);
      }
    });
  }, []);

  useEffect(() => {
    if (request) {
      // Enter: snappy spring, under ~300ms feel
      progress.set(
        reducedMotion
          ? withTiming(1, { duration: theme.motion.duration.ui })
          : withSpring(1, springConfig(theme.motion.spring.snappy))
      );
      return;
    }
    // Exit handled by close handlers with animation first
  }, [request, progress, reducedMotion, theme.motion]);

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const cardStyle = useAnimatedStyle(() => {
    if (reducedMotion) {
      return { opacity: progress.value };
    }
    // scale 0.95→1 + fade — never scale(0)
    return {
      opacity: progress.value,
      transform: [{ scale: 0.95 + progress.value * 0.05 }],
    };
  });

  const finishClose = (id: string, value: boolean) => {
    resolveConfirm(id, value);
    setDisplay(null);
  };

  const animateOutThen = (id: string, value: boolean) => {
    if (reducedMotion) {
      progress.set(
        withTiming(0, { duration: theme.motion.duration.fast }, (done) => {
          if (done) runOnJS(finishClose)(id, value);
        })
      );
      return;
    }
    // Exit faster than enter
    progress.set(
      withSpring(0, springConfig(theme.motion.spring.snappy), (done) => {
        if (done) runOnJS(finishClose)(id, value);
      })
    );
  };

  const onCancel = () => {
    if (!display) return;
    animateOutThen(display.id, false);
  };

  const onConfirm = () => {
    if (!display) return;
    void hapticCommit('warning');
    animateOutThen(display.id, true);
  };

  const visible = display != null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.root} pointerEvents="box-none">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={display?.cancelLabel ?? 'Batal'}
          style={StyleSheet.absoluteFill}
          onPress={onCancel}
        >
          <Animated.View style={[styles.scrim, scrimStyle]} />
        </Pressable>

        {display ? (
          <Animated.View
            style={[styles.card, cardStyle]}
            accessibilityRole="alert"
            accessibilityViewIsModal
          >
            {(() => {
              // Icon menyesuaikan aksi: hapus vs konfirmasi lain (role, dll.)
              const isDelete = /hapus|delete/i.test(
                `${display.confirmLabel} ${display.title}`
              );
              const Icon = isDelete ? Trash2 : AlertTriangle;
              return (
                <View style={styles.iconWrap}>
                  <Icon
                    size={24}
                    color={theme.colors.destructive}
                    strokeWidth={2.2}
                  />
                </View>
              );
            })()}

            <AppText variant="headline" style={styles.title}>
              {display.title}
            </AppText>
            <AppText
              variant="body"
              color="secondaryLabel"
              style={styles.message}
            >
              {display.message}
            </AppText>

            <View style={styles.actions}>
              {/* Bersebelahan: Batal kiri, Hapus kanan (pola HIG / thumb) */}
              <Button
                title={display.cancelLabel}
                variant="gray"
                onPress={onCancel}
                style={styles.actionBtn}
              />
              <Button
                title={display.confirmLabel}
                variant="destructive"
                onPress={onConfirm}
                style={styles.actionBtn}
              />
            </View>
          </Animated.View>
        ) : null}
      </View>
    </Modal>
  );
}
