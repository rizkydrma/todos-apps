/**
 * Typography variants: size + weight + tracking + leading sebagai satu unit.
 * Skala fixed (bukan Dynamic Type reflow). System font only.
 * AppText memakai theme.typography[variant] + theme.colors[color].
 */
import { TextStyle } from 'react-native';
import { fontSize, fontWeight } from './tokens';

/** Nama variant teks yang didukung AppText. */
export type TextVariant =
  'title' | 'headline' | 'subtitle' | 'body' | 'label' | 'caption' | 'link';

export type TypographyStyles = Record<TextVariant, TextStyle>;

/** Style font per variant (ukuran + weight + tracking + leading; warna di AppText). */
export const typography: TypographyStyles = {
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.6,
    lineHeight: 38,
  },
  headline: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  subtitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    letterSpacing: 0,
    lineHeight: 20,
  },
  body: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    letterSpacing: 0,
    lineHeight: 22,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0,
    lineHeight: 22,
  },
  caption: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.regular,
    letterSpacing: 0.2,
    lineHeight: 16,
  },
  link: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0,
    lineHeight: 20,
  },
};
