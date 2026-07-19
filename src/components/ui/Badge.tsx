/**
 * Badge / chip reusable — label + size + selected + optional press.
 *
 * Size: sm | md | lg (default md). Filter drawer pakai sm.
 * Selected: primary fill + onPrimary. Unselected: tertiarySystemFill.
 * tone: default | primary | destructive (display-only tint saat unselected).
 */
import { useAppTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { AppText } from './AppText';

export type BadgeSize = 'sm' | 'md' | 'lg';
export type BadgeTone = 'default' | 'primary' | 'destructive';

export type BadgeProps = {
  label: string;
  size?: BadgeSize;
  /** Highlight selected (filter/form chip). */
  selected?: boolean;
  /** Kalau diisi → Pressable + a11y button. */
  onPress?: () => void;
  leftIcon?: ReactNode;
  /**
   * Warna unselected. selected selalu primary.
   * default = tertiary fill; primary/destructive = soft tint.
   */
  tone?: BadgeTone;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

const SIZE_STYLE: Record<
  BadgeSize,
  {
    paddingHorizontal: number;
    paddingVertical: number;
    minHeight: number;
    fontSize: number;
    gap: number;
    iconSize: number;
  }
> = {
  sm: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    minHeight: 28,
    fontSize: 12,
    gap: 4,
    iconSize: 12,
  },
  md: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 32,
    fontSize: 12,
    gap: 5,
    iconSize: 14,
  },
  lg: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 36,
    fontSize: 14,
    gap: 6,
    iconSize: 16,
  },
};

/**
 * Badge pill. Display-only atau selectable via onPress/selected.
 */
export function Badge({
  label,
  size = 'md',
  selected = false,
  onPress,
  leftIcon,
  tone = 'default',
  style,
  accessibilityLabel,
}: BadgeProps) {
  const { theme } = useAppTheme();
  const s = SIZE_STYLE[size];

  const styles = useThemedStyles((t) => ({
    base: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderRadius: t.radius.full,
      alignSelf: 'flex-start' as const,
    },
  }));

  const backgroundColor = (() => {
    if (selected) return theme.colors.primary;
    if (tone === 'primary') return theme.colors.primary + '22';
    if (tone === 'destructive') return theme.colors.destructive + '22';
    return theme.colors.tertiarySystemFill;
  })();

  const textColor = (() => {
    if (selected) return 'onPrimary' as const;
    if (tone === 'primary') return 'primary' as const;
    if (tone === 'destructive') return 'destructive' as const;
    return 'secondaryLabel' as const;
  })();

  const content = (
    <>
      {leftIcon ? <View style={{ marginRight: 0 }}>{leftIcon}</View> : null}
      <AppText
        variant="caption"
        color={textColor}
        numberOfLines={1}
        style={{
          fontSize: s.fontSize,
          fontWeight: '600',
          letterSpacing: 0.2,
          lineHeight: s.fontSize + 4,
        }}
      >
        {label}
      </AppText>
    </>
  );

  const boxStyle = [
    styles.base,
    {
      paddingHorizontal: s.paddingHorizontal,
      paddingVertical: s.paddingVertical,
      minHeight: s.minHeight,
      gap: s.gap,
      backgroundColor,
    },
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={accessibilityLabel ?? label}
        onPress={onPress}
        hitSlop={4}
        style={({ pressed }) => [
          ...boxStyle,
          pressed ? { opacity: theme.motion.press.opacity } : null,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel ?? label}
      style={boxStyle}
    >
      {content}
    </View>
  );
}

/** Icon size helper untuk leftIcon di Badge size X. */
export function badgeIconSize(size: BadgeSize = 'md'): number {
  return SIZE_STYLE[size].iconSize;
}
