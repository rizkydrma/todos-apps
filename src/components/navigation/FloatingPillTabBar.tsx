/**
 * Floating capsule tab bar.
 *
 * Dark: solid theme fill (#1C1C1E) — NO BlurView/Glass (bocor putih vs app theme).
 * Light: theme fill + optional BlurView light.
 */
import { InitialsAvatar } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
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
import { House, LayoutGrid, Search, Send } from 'lucide-react-native';
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
 * Sengaja longgar di emit/navigate agar assignable tanpa `as unknown as`.
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

/** Tinggi area ikon di dalam pill (tanpa safe-area). */
export const PILL_BAR_CONTENT_HEIGHT = 58;
/** Margin horizontal floating pill. */
export const PILL_BAR_MARGIN_H = 20;
/** Margin di atas home indicator. */
export const PILL_BAR_MARGIN_BOTTOM = 10;

const TAB_ORDER = MAIN_TABS.map((t) => t.name);
const TAB_A11Y: Record<MainTabName, string> = Object.fromEntries(
  MAIN_TABS.map((t) => [t.name, t.a11yLabel])
) as Record<MainTabName, string>;

/**
 * Total inset bawah yang harus dihormati konten tab
 * agar list tidak tertutup pill.
 */
export function useFloatingTabBarInset(): number {
  const insets = useSafeAreaInsets();
  return (
    PILL_BAR_CONTENT_HEIGHT +
    PILL_BAR_MARGIN_BOTTOM +
    Math.max(insets.bottom, 8) +
    8
  );
}

type SlotLayout = { x: number; width: number };

/**
 * Material pill — fill **selalu** dari `fillColor` (theme token).
 * Dark mode: no BlurView/GlassView (native blur bocor putih vs app theme).
 * Light mode: optional BlurView di atas fill putih (boleh gagal; fill tetap ada).
 */
function PillGlassMaterial({
  isDark,
  fillColor,
  reducedTransparency,
}: {
  isDark: boolean;
  /** Hex solid dari theme — sumber kebenaran warna pill. */
  fillColor: string;
  reducedTransparency: boolean;
}) {
  // Dark / reduced transparency: solid only — deterministic
  if (isDark || reducedTransparency) {
    return (
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: fillColor }]}
      />
    );
  }

  // Light: solid fill + iOS native blur only.
  // Android BlurView.dimezis* butuh blurTarget (API baru) — skip agar no warn/fallback.
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
 * Custom tabBar Expo Router / React Navigation — floating glass pill.
 */
export function FloatingPillTabBar({
  state,
  descriptors,
  navigation,
}: FloatingPillTabBarProps) {
  const { theme, isDarkMode } = useAppTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const reducedTransparency = useReducedTransparency();
  const [trackWidth, setTrackWidth] = useState(0);
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

  const activeRoute = state.routes[state.index];
  const activeName = activeRoute?.name ?? '';
  const activeVisibleIndex = Math.max(
    0,
    visibleRoutes.findIndex((r) => r.name === activeName)
  );

  const indicatorX = useSharedValue(0);
  const indicatorW = useSharedValue(0);

  useEffect(() => {
    const raw = visibleRoutes[activeVisibleIndex]?.name;
    const key = raw && isMainTabName(raw) ? raw : undefined;
    const layout = key ? slotLayouts[key] : undefined;
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
    activeVisibleIndex,
    indicatorW,
    indicatorX,
    reducedMotion,
    slotLayouts,
    theme.motion,
    visibleRoutes,
  ]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: indicatorW.value,
  }));

  const bottomOffset = PILL_BAR_MARGIN_BOTTOM + Math.max(insets.bottom, 8);
  // Session theme (ink toggle), bukan system appearance
  const isDark = isDarkMode;

  const activeIconColor = isDark ? '#FFFFFF' : theme.colors.label;
  const inactiveIconColor = isDark
    ? 'rgba(235,235,245,0.6)'
    : theme.colors.secondaryLabel;

  // Active slot dark = fill lebih gelap (bukan frost putih)
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
      case 'categories/index':
        return <LayoutGrid size={size} color={color} strokeWidth={stroke} />;
      case 'tags/index':
        return <Send size={size} color={color} strokeWidth={stroke} />;
      case 'search/index':
        return <Search size={size} color={color} strokeWidth={stroke} />;
      case 'profile/index':
        return (
          <InitialsAvatar
            name={user?.name}
            email={user?.email}
            size={28}
            highlighted={focused}
          />
        );
      default:
        return null;
    }
  };

  // Shadow host terpisah dari overflow:hidden clip — shadow RN tidak ter-clip
  const floatingShadow = Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: isDark ? 0.45 : 0.14,
      shadowRadius: 24,
    },
    android: {
      elevation: 12,
    },
    default: {},
  });

  // Dark: secondarySystemBackground #1C1C1E (bukan putih).
  // Light: putih semi — token secondarySystemGroupedBackground light = #FFF.
  const pillFill = isDark ? theme.colors.secondarySystemBackground : '#F2F2F7';

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom: bottomOffset }]}
    >
      <View
        key={isDark ? 'pill-dark' : 'pill-light'}
        style={[styles.shadowHost, floatingShadow]}
      >
        <View
          style={[
            styles.pillOuter,
            {
              borderColor: outerRing,
              backgroundColor: pillFill,
            },
          ]}
          onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
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
              {trackWidth > 0 ? (
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

              {visibleRoutes.map((route) => {
                if (!isMainTabName(route.name)) return null;
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
              })}
            </View>
          </View>
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
 * Satu slot: press scale spring + a11y.
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

  // Sync scale when focus changes (settle active slightly larger)
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
    left: PILL_BAR_MARGIN_H,
    right: PILL_BAR_MARGIN_H,
  },
  shadowHost: {
    borderRadius: 999,
  },
  pillOuter: {
    borderRadius: 999,
    // Thin outer stroke for separation over busy content
    borderWidth: StyleSheet.hairlineWidth,
    padding: 0,
  },
  pillClip: {
    height: PILL_BAR_CONTENT_HEIGHT,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  specularTop: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 12,
    height: StyleSheet.hairlineWidth * 2,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
  },
  specularBottom: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    height: StyleSheet.hairlineWidth,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  slot: {
    flex: 1,
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
  indicator: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    left: 0,
    borderRadius: 999,
  },
});
