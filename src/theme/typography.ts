import { TextStyle } from 'react-native';
import { fontSize, fontWeight } from './tokens';

export type TextVariant =
  'title' | 'subtitle' | 'body' | 'label' | 'caption' | 'link';

export type TypographyStyles = Record<TextVariant, TextStyle>;

export const typography: TypographyStyles = {
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
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
