/**
 * Entry theme: colors + tokens + typography + motion → lightTheme / darkTheme.
 *
 * ThemeProvider memilih lightTheme atau darkTheme.
 * Export type re-export supaya consumer bisa `import type { Theme } from '@/theme'`.
 */
import { darkColors, lightColors, type SemanticColors } from './colors';
import { motion, type MotionTokens } from './motion';
import {
  fontSize,
  fontWeight,
  getElevation,
  radius,
  size,
  spacing,
} from './tokens';
import { typography, type TypographyStyles } from './typography';

export type ThemeMode = 'light' | 'dark';

/** Objek tema lengkap yang dibaca komponen lewat useAppTheme().theme */
export type Theme = {
  mode: ThemeMode;
  colors: SemanticColors;
  spacing: typeof spacing;
  radius: typeof radius;
  fontSize: typeof fontSize;
  fontWeight: typeof fontWeight;
  size: typeof size;
  typography: TypographyStyles;
  motion: MotionTokens;
  elevation: typeof getElevation;
};

/** Factory internal: mode + palette → Theme. */
function createTheme(mode: ThemeMode, colors: SemanticColors): Theme {
  return {
    mode,
    colors,
    spacing,
    radius,
    fontSize,
    fontWeight,
    size,
    typography,
    motion,
    elevation: getElevation,
  };
}

export const lightTheme = createTheme('light', lightColors);
export const darkTheme = createTheme('dark', darkColors);

export type { ColorRole, SemanticColors } from './colors';
export type { TextVariant, TypographyStyles } from './typography';
export type { FontSize, Radius, Spacing } from './tokens';
export type { MotionTokens, SpringPreset } from './motion';
export { getElevation } from './tokens';
export { motion, projectVelocity, rubberband, springConfig } from './motion';
export { SYSTEM_COLOR_PIN } from './systemColors.ios18';
