import { Platform, ViewStyle } from 'react-native';

export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
} as const;

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const size = {
  /** Minimum recommended touch target */
  touchMin: 44,
  /** Default control height baseline */
  controlHeight: 48,
  /** Square icon / add button */
  iconButton: 50,
} as const;

type ElevationLevel = 'none' | 'sm' | 'md';

/**
 * Platform-aware elevation. Pass shadow color from theme.colors.shadow.
 */
export function getElevation(
  level: ElevationLevel,
  shadowColor: string
): ViewStyle {
  if (level === 'none') {
    return Platform.select<ViewStyle>({
      ios: {
        shadowColor,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
      },
      android: { elevation: 0 },
      default: {},
    })!;
  }

  if (level === 'sm') {
    return Platform.select<ViewStyle>({
      ios: {
        shadowColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
      default: {},
    })!;
  }

  return Platform.select<ViewStyle>({
    ios: {
      shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    android: { elevation: 4 },
    default: {},
  })!;
}

export const tokens = {
  spacing,
  radius,
  fontSize,
  fontWeight,
  size,
} as const;

export type Spacing = keyof typeof spacing;
export type Radius = keyof typeof radius;
export type FontSize = keyof typeof fontSize;
