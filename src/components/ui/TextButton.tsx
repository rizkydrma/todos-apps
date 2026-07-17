import { useThemedStyles } from '@/hooks/useThemedStyles';
import { Pressable, type PressableProps } from 'react-native';
import { AppText } from './AppText';

export type TextButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  title: string;
};

export function TextButton({
  title,
  disabled,
  onPress,
  ...rest
}: TextButtonProps) {
  const styles = useThemedStyles((t) => ({
    root: {
      marginTop: t.spacing.lg,
      alignItems: 'center' as const,
      minHeight: t.size.touchMin,
      justifyContent: 'center' as const,
    },
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.root, { opacity: pressed ? 0.7 : 1 }]}
      {...rest}
    >
      <AppText variant="link" color="primary">
        {title}
      </AppText>
    </Pressable>
  );
}
