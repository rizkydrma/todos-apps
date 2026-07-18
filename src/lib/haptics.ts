/**
 * Commit haptics only — meaningful actions, not every press (CONTEXT.md).
 * Dipanggil saat complete todo, destructive delete, dll.
 */
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Haptic singkat pada commit bermakna.
 * Web / simulator unsupported → silent no-op.
 */
export async function hapticCommit(
  style: 'light' | 'medium' | 'warning' = 'light'
): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    if (style === 'warning') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    await Haptics.impactAsync(
      style === 'medium'
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Light
    );
  } catch {
    // Simulator / unsupported — ignore
  }
}
