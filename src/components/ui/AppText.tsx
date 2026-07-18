/**
 * Text bertema: otomatis pakai typography + warna semantik dari theme.
 *
 * Ganti <Text> mentah di UI dengan AppText supaya light/dark konsisten.
 * Contoh: <AppText variant="title" color="secondaryLabel">Halo</AppText>
 */
import { useAppTheme } from '@/context/ThemeContext';
import type { ColorRole, TextVariant } from '@/theme';
import { Text, type TextProps, type TextStyle } from 'react-native';

/** Subset ColorRole yang masuk akal untuk teks. */
type AppTextColor = Extract<
  ColorRole,
  | 'label'
  | 'secondaryLabel'
  | 'tertiaryLabel'
  | 'quaternaryLabel'
  | 'primary'
  | 'link'
  | 'destructive'
  | 'onPrimary'
  | 'systemBlue'
  | 'systemRed'
>;

export type AppTextProps = TextProps & {
  /** Preset tipografi (title, body, link, …). Default: body. */
  variant?: TextVariant;
  /** Role warna semantik. Default: label. */
  color?: AppTextColor;
};

/**
 * Render Text dengan style dari theme.typography + theme.colors.
 * `style` prop digabung di akhir supaya bisa override lokal.
 */
export function AppText({
  variant = 'body',
  color = 'label',
  style,
  children,
  ...rest
}: AppTextProps) {
  const { theme } = useAppTheme();

  const textStyle: TextStyle = {
    ...theme.typography[variant],
    color: theme.colors[color],
  };

  return (
    <Text style={[textStyle, style]} {...rest}>
      {children}
    </Text>
  );
}
