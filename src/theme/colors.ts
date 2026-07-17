/** Raw palette — internal to theme module only */
const palette = {
  white: '#ffffff',
  black: '#000000',
  slate50: '#f8fafc',
  slate200: '#e2e8f0',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate700: '#334155',
  slate800: '#1e293b',
  slate900: '#0f172a',
  blue500: '#3b82f6',
  blue600: '#007AFF',
  blue700: '#1d4ed8',
  blueDisabled: '#A2C4FF',
  redIos: '#FF3B30',
  redIosDark: '#FF453A',
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
  surface: palette.slate50,
  text: palette.slate900,
  textMuted: palette.slate500,
  border: palette.slate200,
  primary: palette.blue600,
  primaryDisabled: palette.blueDisabled,
  onPrimary: palette.white,
  error: palette.redIos,
  shadow: palette.black,
};

export const darkColors: SemanticColors = {
  background: palette.slate900,
  surface: palette.slate800,
  text: palette.white,
  textMuted: palette.slate400,
  border: palette.slate700,
  primary: palette.blue500,
  primaryDisabled: palette.blue700,
  onPrimary: palette.white,
  error: palette.redIosDark,
  shadow: palette.black,
};

export type ColorRole = keyof SemanticColors;
