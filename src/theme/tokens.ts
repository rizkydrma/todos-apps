/**
 * Design tokens: angka spacing, radius, font, ukuran kontrol.
 * Tidak bergantung light/dark — digabung ke Theme di theme/index.ts.
 *
 * Pakai token (t.spacing.md) di style, jangan magic number acak.
 */
import { Platform, ViewStyle } from 'react-native';

/** Skala spasi (padding/margin/gap) dalam px. */
export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
} as const;

/** Border radius standar. full = pill/circle. */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
} as const;

/** Ukuran font (px). */
export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
} as const;

/** Bobot font sebagai string RN. */
export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

/** Ukuran kontrol UI (touch target, tinggi input, tombol ikon). */
export const size = {
  /** Minimum touch target yang nyaman (~44pt Apple HIG). */
  touchMin: 44,
  /** Tinggi baseline tombol/input. */
  controlHeight: 48,
  /** Tombol kotak/ikon (mis. + tambah todo). */
  iconButton: 50,
} as const;

type ElevationLevel = 'none' | 'sm' | 'md';

/**
 * Shadow/elevation per platform.
 * iOS pakai shadow*, Android pakai elevation.
 * shadowColor biasanya dari theme.colors.shadow.
 *
 * @param level - none | sm | md
 * @param shadowColor - warna bayangan (biasanya hitam)
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
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
      },
      android: { elevation: 0 },
      default: {},
    })!;
  }

  // md — default level untuk card / elevated surface
  return Platform.select<ViewStyle>({
    ios: {
      shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
    },
    android: { elevation: 1 },
    default: {},
  })!;
}

/** Bundle semua token (opsional import satu objek). */
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
