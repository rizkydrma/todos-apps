/** Raw palette — internal to theme module only */
const palette = {
  white: '#FFFFFF',
  black: '#000000',
  // X-like neutrals
  gray50: '#F7F9F9',
  gray100: '#EFF3F4',
  gray400: '#536471',
  gray500: '#71767B',
  gray700: '#2F3336',
  gray800: '#16181C',
  textDark: '#0F1419',
  textLight: '#E7E9EA',
  // X blue + disabled solids (RN needs solid hex, not opacity)
  blue: '#1D9BF0',
  blueDisabledDark: '#0D4F7A',
  blueDisabledLight: '#8ECDF8',
  red: '#F4212E',
} as const;

export type SemanticColors = {
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  primaryDisabled: string;
  onPrimary: string;
  error: string;
  shadow: string;
};

export const lightColors: SemanticColors = {
  background: palette.white,
  surface: palette.gray50,
  text: palette.textDark,
  textMuted: palette.gray400,
  border: palette.gray100,
  primary: palette.blue,
  primaryDisabled: palette.blueDisabledLight,
  onPrimary: palette.white,
  error: palette.red,
  shadow: palette.black,
};

export const darkColors: SemanticColors = {
  background: palette.black,
  surface: palette.gray800,
  text: palette.textLight,
  textMuted: palette.gray500,
  border: palette.gray700,
  primary: palette.blue,
  primaryDisabled: palette.blueDisabledDark,
  onPrimary: palette.white,
  error: palette.red,
  shadow: palette.black,
};

export type ColorRole = keyof SemanticColors;
