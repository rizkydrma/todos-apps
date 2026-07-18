/**
 * Pinned iOS system UI colors (light/dark resolved).
 * Reference pin: iOS 18 / HIG system colors (values from iOS 13+ adaptive set;
 * mint/brown/cyan from later system palette). Bump only via deliberate PR (ADR-0002).
 * Source tables: Apple HIG Color + community-resolved hex (Noah Gilmore / Sarunw cheat sheets).
 * RN supports 8-digit hex (#RRGGBBAA) for alpha labels/fills/separators.
 */
export type SystemColorName =
  | 'systemBackground'
  | 'secondarySystemBackground'
  | 'tertiarySystemBackground'
  | 'systemGroupedBackground'
  | 'secondarySystemGroupedBackground'
  | 'tertiarySystemGroupedBackground'
  | 'systemFill'
  | 'secondarySystemFill'
  | 'tertiarySystemFill'
  | 'quaternarySystemFill'
  | 'label'
  | 'secondaryLabel'
  | 'tertiaryLabel'
  | 'quaternaryLabel'
  | 'separator'
  | 'opaqueSeparator'
  | 'link'
  | 'placeholderText'
  | 'systemBlue'
  | 'systemRed'
  | 'systemGreen'
  | 'systemOrange'
  | 'systemYellow'
  | 'systemPink'
  | 'systemPurple'
  | 'systemTeal'
  | 'systemIndigo'
  | 'systemBrown'
  | 'systemMint'
  | 'systemCyan'
  | 'systemGray'
  | 'systemGray2'
  | 'systemGray3'
  | 'systemGray4'
  | 'systemGray5'
  | 'systemGray6';

export type SystemColorModeMap = Record<SystemColorName, string>;

/** Light appearance resolved values. */
export const systemColorsLight: SystemColorModeMap = {
  systemBackground: '#FFFFFF',
  secondarySystemBackground: '#F2F2F7',
  tertiarySystemBackground: '#FFFFFF',
  systemGroupedBackground: '#F2F2F7',
  secondarySystemGroupedBackground: '#FFFFFF',
  tertiarySystemGroupedBackground: '#F2F2F7',
  systemFill: '#78788033',
  secondarySystemFill: '#78788028',
  tertiarySystemFill: '#7676801E',
  quaternarySystemFill: '#74748014',
  label: '#000000',
  secondaryLabel: '#3C3C4399',
  tertiaryLabel: '#3C3C434C',
  quaternaryLabel: '#3C3C432D',
  separator: '#3C3C434A',
  opaqueSeparator: '#C6C6C8',
  link: '#007AFF',
  placeholderText: '#3C3C434C',
  systemBlue: '#007AFF',
  systemRed: '#FF3B30',
  systemGreen: '#34C759',
  systemOrange: '#FF9500',
  systemYellow: '#FFCC00',
  systemPink: '#FF2D55',
  systemPurple: '#AF52DE',
  systemTeal: '#5AC8FA',
  systemIndigo: '#5856D6',
  systemBrown: '#A2845E',
  systemMint: '#00C7BE',
  systemCyan: '#32ADE6',
  systemGray: '#8E8E93',
  systemGray2: '#AEAEB2',
  systemGray3: '#C7C7CC',
  systemGray4: '#D1D1D6',
  systemGray5: '#E5E5EA',
  systemGray6: '#F2F2F7',
};

/** Dark appearance resolved values. */
export const systemColorsDark: SystemColorModeMap = {
  systemBackground: '#000000',
  secondarySystemBackground: '#1C1C1E',
  tertiarySystemBackground: '#2C2C2E',
  systemGroupedBackground: '#000000',
  secondarySystemGroupedBackground: '#1C1C1E',
  tertiarySystemGroupedBackground: '#2C2C2E',
  systemFill: '#7878805C',
  secondarySystemFill: '#78788052',
  tertiarySystemFill: '#7676803D',
  quaternarySystemFill: '#7676802E',
  label: '#FFFFFF',
  secondaryLabel: '#EBEBF599',
  tertiaryLabel: '#EBEBF54C',
  quaternaryLabel: '#EBEBF52D',
  separator: '#54545899',
  opaqueSeparator: '#38383A',
  link: '#0A84FF',
  placeholderText: '#EBEBF54C',
  systemBlue: '#0A84FF',
  systemRed: '#FF453A',
  systemGreen: '#30D158',
  systemOrange: '#FF9F0A',
  systemYellow: '#FFD60A',
  systemPink: '#FF375F',
  systemPurple: '#BF5AF2',
  systemTeal: '#64D2FF',
  systemIndigo: '#5E5CE6',
  systemBrown: '#AC8E68',
  systemMint: '#63E6E2',
  systemCyan: '#64D2FF',
  systemGray: '#8E8E93',
  systemGray2: '#636366',
  systemGray3: '#48484A',
  systemGray4: '#3A3A3C',
  systemGray5: '#2C2C2E',
  systemGray6: '#1C1C1E',
};

export const SYSTEM_COLOR_PIN = 'ios18' as const;
