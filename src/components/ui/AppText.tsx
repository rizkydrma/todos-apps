import { useAppTheme } from '@/context/ThemeContext';
import type { ColorRole, TextVariant } from '@/theme';
import { Text, type TextProps, type TextStyle } from 'react-native';

type AppTextColor = Extract<
  ColorRole,
  'text' | 'textMuted' | 'primary' | 'error' | 'onPrimary'
>;

export type AppTextProps = TextProps & {
  variant?: TextVariant;
  color?: AppTextColor;
};

export function AppText({
  variant = 'body',
  color = 'text',
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
