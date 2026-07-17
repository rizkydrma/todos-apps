/**
 * Preset tipografi per variant teks (title, body, link, …).
 * AppText memakai theme.typography[variant] + theme.colors[color].
 */
import { TextStyle } from 'react-native';
import { fontSize, fontWeight } from './tokens';

/** Nama variant teks yang didukung AppText. */
export type TextVariant =
  'title' | 'subtitle' | 'body' | 'label' | 'caption' | 'link';

export type TypographyStyles = Record<TextVariant, TextStyle>;

/** Style font per variant (ukuran + weight; warna di-set terpisah di AppText). */
export const typography: TypographyStyles = {
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
  },
  body: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  caption: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  link: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
};
