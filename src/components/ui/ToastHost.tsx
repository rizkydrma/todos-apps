/**
 * Host visual toast — pasang sekali di root layout (di dalam ThemeProvider).
 *
 * Render di atas navigasi (absolute + high zIndex), menghormati safe area top.
 * Data dari store imperatif `src/lib/toast.ts` (bukan React Context).
 */
import { useAppTheme } from '@/context/ThemeContext';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import {
  subscribeToasts,
  toast,
  type ToastItem,
  type ToastVariant,
} from '@/lib/toast';
import { useEffect, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Satu baris toast dengan fade + slide masuk/keluar. */
function ToastCard({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const { theme } = useAppTheme();
  const reducedMotion = useReducedMotion();
  // useState (bukan useRef.current) supaya linter React 19 tidak flag ref-during-render
  const [opacity] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => new Animated.Value(-12));

  const styles = useThemedStyles((t) => ({
    card: {
      borderWidth: 1,
      borderRadius: t.radius.lg,
      paddingVertical: t.spacing.sm + 2,
      paddingHorizontal: t.spacing.md,
      marginBottom: t.spacing.sm,
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      gap: t.spacing.sm,
      ...t.elevation('md', t.colors.shadow),
    },
    accent: {
      width: 3,
      borderRadius: 2,
      alignSelf: 'stretch' as const,
      marginVertical: 2,
    },
    body: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      fontSize: t.fontSize.sm,
      fontWeight: t.fontWeight.semibold,
      marginBottom: 2,
    },
    message: {
      fontSize: t.fontSize.sm,
      fontWeight: t.fontWeight.regular,
      lineHeight: t.fontSize.sm + 4,
    },
  }));

  useEffect(() => {
    const duration = theme.motion.duration.ui;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: reducedMotion ? 0 : duration,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, reducedMotion, theme.motion.duration.ui]);

  const accentColor = accentForVariant(item.variant, theme.colors);
  const titleColor =
    item.variant === 'error' ? theme.colors.destructive : theme.colors.label;

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY }],
      }}
    >
      <Pressable
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        onPress={() => onDismiss(item.id)}
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.secondarySystemBackground,
            borderColor: theme.colors.separator,
          },
        ]}
      >
        <View style={[styles.accent, { backgroundColor: accentColor }]} />
        <View style={styles.body}>
          {item.title ? (
            <Text
              style={[styles.title, { color: titleColor }]}
              numberOfLines={2}
            >
              {item.title}
            </Text>
          ) : null}
          <Text
            style={[styles.message, { color: theme.colors.label }]}
            numberOfLines={4}
          >
            {item.message}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function accentForVariant(
  variant: ToastVariant,
  colors: {
    primary: string;
    destructive: string;
    secondaryLabel: string;
    systemGreen: string;
  }
): string {
  switch (variant) {
    case 'success':
      return colors.systemGreen;
    case 'error':
      return colors.destructive;
    case 'info':
    default:
      return colors.secondaryLabel;
  }
}

/**
 * Overlay toast di top of screen. Return null jika tidak ada item.
 * Harus child dari SafeAreaProvider + ThemeProvider.
 */
export function ToastHost() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<ToastItem[]>([]);

  const styles = useThemedStyles((t) => ({
    host: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      elevation: 9999,
      paddingHorizontal: t.spacing.md,
      pointerEvents: 'box-none' as const,
    },
  }));

  useEffect(() => subscribeToasts(setItems), []);

  if (items.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.host, { paddingTop: insets.top + 8 }]}
    >
      {items.map((item) => (
        <ToastCard key={item.id} item={item} onDismiss={toast.dismiss} />
      ))}
    </View>
  );
}
