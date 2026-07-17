import { darkColors, lightColors, type SemanticColors } from './colors';
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

export type Theme = {
  mode: ThemeMode;
  colors: SemanticColors;
  spacing: typeof spacing;
  radius: typeof radius;
  fontSize: typeof fontSize;
  fontWeight: typeof fontWeight;
  size: typeof size;
  typography: TypographyStyles;
  elevation: typeof getElevation;
};

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
    elevation: getElevation,
  };
}

export const lightTheme = createTheme('light', lightColors);
export const darkTheme = createTheme('dark', darkColors);

export type { ColorRole, SemanticColors } from './colors';
export type { TextVariant, TypographyStyles } from './typography';
export type { FontSize, Radius, Spacing } from './tokens';
export { getElevation } from './tokens';
