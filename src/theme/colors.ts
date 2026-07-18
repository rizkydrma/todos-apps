/**
 * Semantic colors for the app: full HIG system set + thin app aliases.
 * Hex lives only here and in systemColors.ios18.ts.
 * Komponen UI harus pakai theme.colors.*, jangan hardcode hex di screen.
 */
import {
  systemColorsDark,
  systemColorsLight,
  type SystemColorModeMap,
} from './systemColors.ios18';

/** App-only aliases (bukan nama UIColor). */
export type AppColorAliases = {
  primary: string;
  primaryDisabled: string;
  onPrimary: string;
  destructive: string;
  /** Scrim untuk toast/modal dimming */
  overlay: string;
  /** iOS shadowColor baseline */
  shadow: string;
};

export type SemanticColors = SystemColorModeMap & AppColorAliases;

export type ColorRole = keyof SemanticColors;

function withAliases(
  system: SystemColorModeMap,
  aliases: AppColorAliases
): SemanticColors {
  return { ...system, ...aliases };
}

/** Mapping role → hex untuk light mode. */
export const lightColors: SemanticColors = withAliases(systemColorsLight, {
  primary: systemColorsLight.systemBlue,
  // Solid disabled blues (RN backgrounds kurang bagus dengan opacity-only)
  primaryDisabled: '#99C9FF',
  onPrimary: '#FFFFFF',
  destructive: systemColorsLight.systemRed,
  overlay: '#00000066',
  shadow: '#000000',
});

/** Mapping role → hex untuk dark mode. */
export const darkColors: SemanticColors = withAliases(systemColorsDark, {
  primary: systemColorsDark.systemBlue,
  primaryDisabled: '#0A3D7A',
  onPrimary: '#FFFFFF',
  destructive: systemColorsDark.systemRed,
  overlay: '#00000099',
  shadow: '#000000',
});
