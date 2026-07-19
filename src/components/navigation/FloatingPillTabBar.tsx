/**
 * Floating capsule tab bar — 3 slot: Home | + (create) | Profile.
 *
 * Pill **hug content** (bukan full-bleed) supaya Home/Profile proporsional.
 * Center + lebih besar, **standalone** — menonjol di atas tinggi pill.
 *
 * + = action (bukan tab), tanpa sliding indicator.
 * Create lewat useTodoCreate() di TodoCreateProvider.
 */
import { useAppTheme } from '@/context/ThemeContext';
import { useTodoCreate } from '@/features/todos/context/TodoCreateContext';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useReducedTransparency } from '@/hooks/useReducedTransparency';
import { hapticCommit } from '@/lib/haptics';
import {
  isMainTabName,
  MAIN_TABS,
  type MainTabName,
} from '@/navigation/mainTabs';
import { springConfig } from '@/theme';
import { BlurView } from 'expo-blur';
import { House, Plus, User } from 'lucide-react-native';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TabRoute = { key: string; name: string };

/**
 * Props struktural kompatibel dengan React Navigation tabBar callback.
 */
export type FloatingPillTabBarProps = {
  state: {
    index: number;
    routes: readonly TabRoute[];
  };
  descriptors: Record<string, { options: Record<string, unknown> }>;
  navigation: {
    emit: (event: {
      type: string;
      target?: string;
      canPreventDefault?: boolean;
    }) => { defaultPrevented: boolean };
    navigate: (name: string, params?: object) => void;
  };
};

/** Tinggi kapsul tab (Home / Profile) — tanpa protrusion +. */
export const PILL_BAR_CONTENT_HEIGHT = 52;
/** Margin di atas home indicator. */
export const PILL_BAR_MARGIN_BOTTOM = 10;
/** Lebar hit-target tiap tab (fixed — bukan flex full-bleed). */
const TAB_SLOT_WIDTH = 56;
/** Celah tengah di dalam pill untuk + yang overlapping. */
const CENTER_GAP = 76;
/** Padding horizontal dalam pill. */
const PILL_PAD_H = 6;
/** Diameter tombol + (lebih besar dari pill). */
const PLUS_SIZE = 60;
/** Seberapa jauh puncak + di atas tepi atas pill. */
const PLUS_PROTRUSION = 18;
/** Ikon + di dalam circle. */
const PLUS_ICON = 28;

/** Tinggi total dock (pill + bagian + yang menjulang). */
const DOCK_HEIGHT = PILL_BAR_CONTENT_HEIGHT + PLUS_PROTRUSION;
/** bottom offset + di dalam dock (dari bawah). */
const PLUS_BOTTOM = PILL_BAR_CONTENT_HEIGHT + PLUS_PROTRUSION - PLUS_SIZE;

const TAB_ORDER = MAIN_TABS.map((t) => t.name);
const TAB_A11Y: Record<MainTabName, string> = Object.fromEntries(
  MAIN_TABS.map((t) => [t.name, t.a11yLabel])
) as Record<MainTabName, string>;

/**
 * Total inset bawah konten tab — pill + protrusion + + safe area.
 */
export function useFloatingTabBarInset(): number {
  const insets = useSafeAreaInsets();
  return DOCK_HEIGHT + PILL_BAR_MARGIN_BOTTOM + Math.max(insets.bottom, 8) + 8;
}

type SlotLayout = { x: number; width: number };

/**
 * Material pill — fill **selalu** dari `fillColor` (theme token).
 */
function PillGlassMaterial({
  isDark,
  fillColor,
  reducedTransparency,
}: {
  isDark: boolean;
  fillColor: string;
  reducedTransparency: boolean;
}) {
  if (isDark || reducedTransparency) {
    return (
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: fillColor }]}
      />
    );
  }

  return (
    <>
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: fillColor }]}
      />
      {Platform.OS === 'ios' ? (
        <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
      ) : null}
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: 'rgba(255,255,255,0.25)' },
        ]}
      />
    </>
  );
}

/**
 * Center + — primary action, diameter > tinggi pill, menjulang ke atas.
 */
function CenterCreateButton({ reducedMotion }: { reducedMotion: boolean }) {
  const { theme, isDarkMode } = useAppTheme();
  const { openCreate } = useTodoCreate();
  const scale = useSharedValue(1);
  const spring = springConfig(theme.motion.spring.snappy);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // elevation + harus > pill (Android stacking); zIndex untuk iOS
  const plusShadow = Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDarkMode ? 0.4 : 0.2,
      shadowRadius: 12,
    },
    android: { elevation: 20 },
    default: {},
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Tambah todo"
      onPress={() => {
        void hapticCommit('medium');
        openCreate();
      }}
      onPressIn={() => {
        if (reducedMotion) return;
        scale.set(withSpring(0.9, spring));
      }}
      onPressOut={() => {
        if (reducedMotion) return;
        scale.set(withSpring(1, spring));
      }}
      hitSlop={6}
      style={styles.plusPressable}
    >
      <Animated.View
        style={[
          styles.plusCircle,
          plusShadow,
          { backgroundColor: theme.colors.primary },
          animStyle,
        ]}
      >
        <Plus
          size={PLUS_ICON}
          color={theme.colors.onPrimary}
          strokeWidth={2.6}
        />
      </Animated.View>
    </Pressable>
  );
}

/**
 * Custom tabBar Expo Router — floating pill compact: Home | + raised | Profile.
 */
export function FloatingPillTabBar({
  state,
  descriptors,
  navigation,
}: FloatingPillTabBarProps) {
  const { theme, isDarkMode } = useAppTheme();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const reducedTransparency = useReducedTransparency();
  const [slotLayouts, setSlotLayouts] = useState<
    Partial<Record<MainTabName, SlotLayout>>
  >({});

  const visibleRoutes = useMemo(() => {
    const filtered = state.routes.filter((route) => {
      const options = descriptors[route.key]?.options;
      if (options?.href === null) return false;
      return isMainTabName(route.name);
    });
    return [...filtered].sort((a, b) => {
      return (
        TAB_ORDER.indexOf(a.name as MainTabName) -
        TAB_ORDER.indexOf(b.name as MainTabName)
      );
    });
  }, [descriptors, state.routes]);

  const homeRoute = visibleRoutes.find((r) => r.name === 'todos/index');
  const profileRoute = visibleRoutes.find((r) => r.name === 'profile/index');

  const activeRoute = state.routes[state.index];
  const activeName = activeRoute?.name ?? '';
  const activeTabName: MainTabName | null = isMainTabName(activeName)
    ? activeName
    : null;

  const indicatorX = useSharedValue(0);
  const indicatorW = useSharedValue(0);

  useEffect(() => {
    if (!activeTabName) return;
    const layout = slotLayouts[activeTabName];
    if (!layout) return;
    const spring = springConfig(theme.motion.spring.snappy);
    if (reducedMotion) {
      indicatorX.set(
        withTiming(layout.x, { duration: theme.motion.duration.ui })
      );
      indicatorW.set(
        withTiming(layout.width, { duration: theme.motion.duration.ui })
      );
      return;
    }
    indicatorX.set(withSpring(layout.x, spring));
    indicatorW.set(withSpring(layout.width, spring));
  }, [
    activeTabName,
    indicatorW,
    indicatorX,
    reducedMotion,
    slotLayouts,
    theme.motion,
  ]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: indicatorW.value,
  }));

  const bottomOffset = PILL_BAR_MARGIN_BOTTOM + Math.max(insets.bottom, 8);
  const isDark = isDarkMode;

  const activeIconColor = isDark ? '#FFFFFF' : theme.colors.label;
  const inactiveIconColor = isDark
    ? 'rgba(235,235,245,0.6)'
    : theme.colors.secondaryLabel;

  const highlightBg = isDark ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.06)';
  const borderColor = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)';
  const outerRing = isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.08)';

  const onSlotLayout = (key: MainTabName, e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    setSlotLayouts((prev) => {
      const existing = prev[key];
      if (existing && existing.x === x && existing.width === width) return prev;
      return { ...prev, [key]: { x, width } };
    });
  };

  const onTabPress = (
    routeName: string,
    routeKey: string,
    isFocused: boolean
  ) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: routeKey,
      canPreventDefault: true,
    });
    if (!isFocused && !event.defaultPrevented) {
      void hapticCommit('light');
      navigation.navigate(routeName);
    }
  };

  const renderIcon = (name: MainTabName, focused: boolean) => {
    const color = focused ? activeIconColor : inactiveIconColor;
    const size = 22;
    const stroke = focused ? 2.4 : 2;
    switch (name) {
      case 'todos/index':
        return <House size={size} color={color} strokeWidth={stroke} />;
      case 'profile/index':
        return <User size={size} color={color} strokeWidth={stroke} />;
      default:
        return null;
    }
  };

  // Pill elevation < plus (Android). Jangan remount pill lewat key tema —
  // remount bisa me-reset z-order native dan menaruh pill di atas +.
  const floatingShadow = Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: isDark ? 0.45 : 0.14,
      shadowRadius: 24,
    },
    android: {
      elevation: 10,
    },
    default: {},
  });

  const pillFill = isDark ? theme.colors.secondarySystemBackground : '#F2F2F7';

  const renderTab = (route: TabRoute | undefined) => {
    if (!route || !isMainTabName(route.name)) return null;
    const key = route.name;
    const isFocused = state.routes[state.index]?.key === route.key;
    return (
      <TabSlot
        key={route.key}
        label={TAB_A11Y[key]}
        focused={isFocused}
        reducedMotion={reducedMotion}
        onLayout={(e) => onSlotLayout(key, e)}
        onPress={() => onTabPress(route.name, route.key, isFocused)}
      >
        {renderIcon(key, isFocused)}
      </TabSlot>
    );
  };

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom: bottomOffset }]}
    >
      {/* Dock centered — lebar = pill hug content, bukan edge-to-edge */}
      <View style={styles.dock} pointerEvents="box-none">
        <View
          style={[
            styles.pillOuter,
            floatingShadow,
            { borderColor: outerRing, backgroundColor: pillFill },
          ]}
        >
          <View
            style={[
              styles.pillClip,
              {
                borderColor,
                backgroundColor: pillFill,
              },
            ]}
          >
            <PillGlassMaterial
              isDark={isDark}
              fillColor={pillFill}
              reducedTransparency={reducedTransparency}
            />

            <View style={styles.row}>
              {activeTabName && slotLayouts[activeTabName] ? (
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.indicator,
                    {
                      backgroundColor: highlightBg,
                      borderWidth: StyleSheet.hairlineWidth,
                      borderColor: isDark
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(0,0,0,0.06)',
                    },
                    indicatorStyle,
                  ]}
                />
              ) : null}

              {renderTab(homeRoute)}
              {/* Spacer — + di-overlay di luar overflow:hidden pill */}
              <View style={styles.centerGap} pointerEvents="none" />
              {renderTab(profileRoute)}
            </View>
          </View>
        </View>

        {/* + di atas pill: zIndex + elevation > pill (fix theme-change stacking) */}
        <View style={styles.plusHost} pointerEvents="box-none">
          <CenterCreateButton reducedMotion={reducedMotion} />
        </View>
      </View>
    </View>
  );
}

type TabSlotProps = {
  children: ReactNode;
  label: string;
  focused: boolean;
  reducedMotion: boolean;
  onPress: () => void;
  onLayout: (e: LayoutChangeEvent) => void;
};

/**
 * Satu slot tab fixed-width — press scale spring + a11y.
 */
function TabSlot({
  children,
  label,
  focused,
  reducedMotion,
  onPress,
  onLayout,
}: TabSlotProps) {
  const { theme } = useAppTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const spring = springConfig(theme.motion.spring.snappy);

  useEffect(() => {
    if (reducedMotion) {
      scale.set(1);
      return;
    }
    scale.set(withSpring(focused ? 1.06 : 1, spring));
  }, [focused, reducedMotion, scale, spring]);

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      onPress={onPress}
      onPressIn={() => {
        if (reducedMotion) return;
        scale.set(withSpring(0.9, spring));
      }}
      onPressOut={() => {
        if (reducedMotion) return;
        scale.set(withSpring(focused ? 1.06 : 1, spring));
      }}
      onLayout={onLayout}
      style={styles.slot}
    >
      <Animated.View style={[styles.slotInner, animStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  /** Tinggi = pill + protrusion; pill di bawah, + di tengah atas. */
  dock: {
    height: DOCK_HEIGHT,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  pillOuter: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    // Di bawah + (sibling absolute)
    zIndex: 0,
  },
  pillClip: {
    height: PILL_BAR_CONTENT_HEIGHT,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    // Hug content: 2 tab + gap tengah + pad
    width: TAB_SLOT_WIDTH * 2 + CENTER_GAP + PILL_PAD_H * 2,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PILL_PAD_H,
  },
  slot: {
    width: TAB_SLOT_WIDTH,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotInner: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  centerGap: {
    width: CENTER_GAP,
    height: '100%',
  },
  plusHost: {
    position: 'absolute',
    bottom: PLUS_BOTTOM,
    alignSelf: 'center',
    width: PLUS_SIZE,
    height: PLUS_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    // Harus > pillOuter (zIndex 0 / elevation 10) di semua platform
    zIndex: 20,
    elevation: 20,
  },
  plusPressable: {
    width: PLUS_SIZE,
    height: PLUS_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  plusCircle: {
    width: PLUS_SIZE,
    height: PLUS_SIZE,
    borderRadius: PLUS_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    position: 'absolute',
    top: 5,
    bottom: 5,
    left: 0,
    borderRadius: 999,
  },
});
