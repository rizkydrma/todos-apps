/**
 * Single source of truth untuk tab shell member.
 * FloatingPillTabBar + Tabs.Screen layout membaca ini — jangan hardcode route di dua tempat.
 *
 * Shell visual: Home | + (action, bukan tab) | Profile.
 * + di-host lewat TodoCreateProvider, bukan route.
 */

export const MAIN_TAB_NAMES = ['todos/index', 'profile/index'] as const;

export type MainTabName = (typeof MAIN_TAB_NAMES)[number];

export type MainTabConfig = {
  /** Nama route expo-router (file-based). */
  name: MainTabName;
  /** Title native / a11y. */
  title: string;
  /** accessibilityLabel tab. */
  a11yLabel: string;
};

/**
 * Urutan tab route di pill (kiri → kanan), tanpa center action.
 */
export const MAIN_TABS: readonly MainTabConfig[] = [
  { name: 'todos/index', title: 'Home', a11yLabel: 'Home' },
  { name: 'profile/index', title: 'Profile', a11yLabel: 'Profile' },
] as const;

export function isMainTabName(name: string): name is MainTabName {
  return (MAIN_TAB_NAMES as readonly string[]).includes(name);
}
