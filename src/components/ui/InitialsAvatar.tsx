/**
 * Avatar lingkaran dari inisial nama (atau email).
 * Siap diganti foto bila API menyediakan imageUri di masa depan.
 */
import { useAppTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import {
  Image,
  View,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { AppText } from './AppText';

export type InitialsAvatarProps = {
  /** Nama lengkap → 1–2 huruf. Fallback email / "?". */
  name?: string | null;
  email?: string | null;
  /** URL foto opsional (belum ada di PublicUser). */
  imageUri?: string | null;
  /** Diameter px. Default 28 (cocok tab bar). */
  size?: number;
  /** Ring highlight saat tab aktif. */
  highlighted?: boolean;
  style?: StyleProp<ViewStyle | ImageStyle>;
};

/**
 * Ambil 1–2 inisial dari nama; bila kosong, huruf pertama email.
 */
export function getInitials(
  name?: string | null,
  email?: string | null
): string {
  const trimmed = name?.trim();
  if (trimmed) {
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (
        (parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')
      ).toUpperCase();
    }
    return trimmed.slice(0, 2).toUpperCase();
  }
  const e = email?.trim();
  if (e) return e.slice(0, 1).toUpperCase();
  return '?';
}

/**
 * Avatar profil: foto jika ada, else inisial di atas fill tema.
 */
export function InitialsAvatar({
  name,
  email,
  imageUri,
  size = 28,
  highlighted = false,
  style,
}: InitialsAvatarProps) {
  const { theme } = useAppTheme();
  const initials = getInitials(name, email);
  const styles = useThemedStyles((t) => ({
    root: {
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      overflow: 'hidden' as const,
      backgroundColor: t.colors.tertiarySystemFill,
      borderWidth: 1.5,
    },
  }));

  const borderColor = highlighted
    ? theme.mode === 'dark'
      ? '#FFFFFF'
      : theme.colors.label
    : theme.colors.separator;

  if (imageUri) {
    const imageStyle: ImageStyle = {
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: 1.5,
      borderColor,
      overflow: 'hidden',
      backgroundColor: theme.colors.tertiarySystemFill,
    };
    return (
      <Image
        source={{ uri: imageUri }}
        accessibilityIgnoresInvertColors
        style={imageStyle}
      />
    );
  }

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={name ? `Avatar ${name}` : 'Avatar'}
      style={[
        styles.root,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor,
        },
        style,
      ]}
    >
      <AppText
        variant="caption"
        color="label"
        style={{
          fontSize: size * 0.38,
          fontWeight: theme.fontWeight.semibold,
          lineHeight: size * 0.42,
        }}
      >
        {initials}
      </AppText>
    </View>
  );
}
