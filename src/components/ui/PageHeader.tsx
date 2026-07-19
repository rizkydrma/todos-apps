/**
 * Page header setara pola UINavigationBar + large titles (HIG), bukan shortcut 1-baris.
 *
 * Struktur Apple:
 * 1. Chrome sticky (safe area + 44pt): leading | compact title | trailing
 * 2. Large title full-width di *konten scroll* (bukan di chrome)
 * 3. Saat scroll: compact title fade-in; material (blur) + hairline edge muncul
 *
 * API:
 * - <PageHeader /> — static (profile, modal): chrome + large title stacked
 * - usePageHeaderCollapse() + Chrome + LargeTitle — list/scroll screens
 * - <PageHeader.BackButton /> — back 44pt + press spring
 */
import { useAppTheme } from '@/context/ThemeContext';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { springConfig } from '@/theme';
import { BlurView } from 'expo-blur';
import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from './AppText';

// —— Collapse thresholds (px contentOffset.y) ————————————————
/** Mulai fade compact title / material. */
export const PAGE_HEADER_COLLAPSE_START = 12;
/** Compact title & material fully on. */
export const PAGE_HEADER_COLLAPSE_END = 52;

// —— Collapse hook ——————————————————————————————————————————

export type PageHeaderCollapse = {
  /** Shared Y offset untuk Chrome material + compact title. */
  scrollY: SharedValue<number>;
  /** Pasang ke Animated.FlatList / Animated.ScrollView onScroll. */
  scrollHandler: ReturnType<typeof useAnimatedScrollHandler>;
};

/**
 * Sumber kebenaran scroll untuk large-title collapse.
 * Satu instance per screen; bagikan scrollY ke Chrome.
 */
export function usePageHeaderCollapse(): PageHeaderCollapse {
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      // contentOffset bisa negatif (rubber-band iOS) — clamp di interpolator
      scrollY.value = event.contentOffset.y;
    },
  });
  return { scrollY, scrollHandler };
}

// —— Back button (44pt, press-down feedback) ————————————————

export type PageHeaderBackButtonProps = {
  onPress: () => void;
  accessibilityLabel?: string;
};

/**
 * Back control HIG: chevron kiri, min 44×44, highlight on press-in.
 * Tint primary (link blue) — familiar iOS navigation.
 */
export function PageHeaderBackButton({
  onPress,
  accessibilityLabel = 'Kembali',
}: PageHeaderBackButtonProps) {
  const { theme } = useAppTheme();
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const styles = useThemedStyles((t) => ({
    hit: {
      minWidth: t.size.touchMin,
      minHeight: t.size.touchMin,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      // Sedikit tarik ke kiri agar chevron visual selaras margin HIG (~-8)
      marginLeft: -t.spacing.sm,
    },
  }));

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const spring = springConfig(theme.motion.spring.snappy);
  const fastMs = theme.motion.duration.fast;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={10}
      onPress={onPress}
      onPressIn={() => {
        if (reducedMotion) {
          opacity.set(
            withTiming(theme.motion.press.opacity, { duration: fastMs })
          );
          return;
        }
        scale.set(withSpring(theme.motion.press.scale, spring));
      }}
      onPressOut={() => {
        if (reducedMotion) {
          opacity.set(withTiming(1, { duration: fastMs }));
          return;
        }
        scale.set(withSpring(1, spring));
      }}
      style={styles.hit}
    >
      <Animated.View style={animStyle}>
        <ChevronLeft
          size={28}
          color={theme.colors.primary}
          strokeWidth={2.25}
        />
      </Animated.View>
    </Pressable>
  );
}

// —— Chrome (sticky nav bar) ————————————————————————————————

export type PageHeaderChromeProps = {
  /** Judul compact (muncul saat collapsed). Sama dengan large title. */
  title: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  /**
   * Bila diisi, chrome menampilkan compact title + material berdasar scroll.
   * Tanpa scrollY: chrome transparan, tanpa compact title (large title di bawah static).
   */
  scrollY?: SharedValue<number>;
  /** Tambah padding top safe area. Default true. */
  safeTop?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Bar navigasi sticky: leading | compact title | trailing.
 * Material blur + hairline hanya saat elevated (scrollY lewat threshold).
 */
export function PageHeaderChrome({
  title,
  leading,
  trailing,
  scrollY,
  safeTop = true,
  style,
}: PageHeaderChromeProps) {
  const { isDarkMode } = useAppTheme();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  const styles = useThemedStyles((t) => ({
    root: {
      zIndex: 20,
      overflow: 'hidden' as const,
    },
    bar: {
      minHeight: t.size.touchMin,
      paddingHorizontal: t.spacing.md,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.sm,
    },
    side: {
      minWidth: t.size.touchMin,
      minHeight: t.size.touchMin,
      justifyContent: 'center' as const,
    },
    sideEnd: {
      minWidth: t.size.touchMin,
      minHeight: t.size.touchMin,
      justifyContent: 'center' as const,
      alignItems: 'flex-end' as const,
    },
    center: {
      flex: 1,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      minWidth: 0,
    },
    hairline: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: t.colors.separator,
    },
  }));

  const topPad = safeTop ? insets.top : 0;

  // Compact title opacity (0 → 1)
  const compactTitleStyle = useAnimatedStyle(() => {
    if (!scrollY) return { opacity: 0 };
    if (reducedMotion) {
      return {
        opacity: scrollY.value >= PAGE_HEADER_COLLAPSE_END ? 1 : 0,
      };
    }
    return {
      opacity: interpolate(
        scrollY.value,
        [PAGE_HEADER_COLLAPSE_START, PAGE_HEADER_COLLAPSE_END],
        [0, 1],
        Extrapolation.CLAMP
      ),
    };
  });

  // Material / hairline strength
  const materialOpacityStyle = useAnimatedStyle(() => {
    if (!scrollY) return { opacity: 0 };
    if (reducedMotion) {
      return {
        opacity: scrollY.value >= PAGE_HEADER_COLLAPSE_START ? 1 : 0,
      };
    }
    return {
      opacity: interpolate(
        scrollY.value,
        [0, PAGE_HEADER_COLLAPSE_START, PAGE_HEADER_COLLAPSE_END],
        [0, 0.55, 1],
        Extrapolation.CLAMP
      ),
    };
  });

  const fillColor = isDarkMode
    ? 'rgba(28,28,30,0.78)'
    : 'rgba(242,242,247,0.78)';

  return (
    <View
      style={[styles.root, { paddingTop: topPad }, style]}
      accessibilityRole="header"
    >
      {/* Material layer — hanya “nyala” saat elevated */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, materialOpacityStyle]}
      >
        {/* iOS only — Android dimezis blur butuh blurTarget (hindari warn API baru) */}
        {Platform.OS === 'ios' ? (
          <BlurView
            intensity={isDarkMode ? 40 : 55}
            tint={isDarkMode ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: fillColor }]}
        />
      </Animated.View>

      <View style={styles.bar}>
        <View style={styles.side}>{leading ?? null}</View>

        <View style={styles.center}>
          <Animated.View style={compactTitleStyle}>
            <AppText
              variant="label"
              numberOfLines={1}
              style={{ textAlign: 'center' }}
            >
              {title}
            </AppText>
          </Animated.View>
        </View>

        <View style={styles.sideEnd}>{trailing ?? null}</View>
      </View>

      <Animated.View style={[styles.hairline, materialOpacityStyle]} />
    </View>
  );
}

// —— Large title (lives in scroll content) ——————————————————

export type PageHeaderLargeTitleProps = {
  title: string;
  subtitle?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Large title full-width — taruh di ListHeaderComponent / atas ScrollView.
 * Scroll menjauhkan ini di bawah chrome; compact title di chrome menggantikannya.
 */
export function PageHeaderLargeTitle({
  title,
  subtitle,
  style,
}: PageHeaderLargeTitleProps) {
  const styles = useThemedStyles((t) => ({
    root: {
      paddingHorizontal: t.spacing.lg,
      paddingTop: t.spacing.xs,
      paddingBottom: t.spacing.sm,
      gap: 4,
    },
  }));

  return (
    <View style={[styles.root, style]} accessibilityRole="header">
      <AppText variant="title" numberOfLines={2}>
        {title}
      </AppText>
      {subtitle ? (
        <AppText variant="subtitle" color="secondaryLabel" numberOfLines={3}>
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );
}

// —— Convenience composite (static screens) ————————————————

export type PageHeaderProps = {
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  /**
   * @deprecated Large title selalu di baris kedua (HIG). Diabaikan — tetap ada
   * untuk kompatibilitas call-site lama.
   */
  size?: 'large' | 'standard';
  safeTop?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Header static: Chrome (tanpa collapse) + LargeTitle di bawah.
 * Untuk Profile, modal form, loading shell — bukan list scroll.
 */
export function PageHeader({
  title,
  subtitle,
  leading,
  trailing,
  safeTop = true,
  style,
}: PageHeaderProps) {
  return (
    <View style={style}>
      <PageHeaderChrome
        title={title}
        leading={leading}
        trailing={trailing}
        safeTop={safeTop}
      />
      <PageHeaderLargeTitle title={title} subtitle={subtitle} />
    </View>
  );
}
