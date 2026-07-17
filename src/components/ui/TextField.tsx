import { useAppTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { TextInput, type TextInputProps, View } from 'react-native';
import { AppText } from './AppText';

export type TextFieldProps<T extends FieldValues> = Omit<
  TextInputProps,
  'style'
> & {
  control: Control<T>;
  name: Path<T>;
  error?: string;
  innerRef?: React.RefObject<TextInput | null>;
};

export function TextField<T extends FieldValues>({
  control,
  name,
  error,
  innerRef,
  placeholder,
  ...restProps
}: TextFieldProps<T>) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles((t) => ({
    container: {
      width: '100%' as const,
      marginTop: t.spacing.md,
    },
    input: {
      borderWidth: 1,
      padding: 14,
      borderRadius: t.radius.sm,
      fontSize: t.fontSize.md,
    },
    errorText: {
      marginTop: t.spacing.xs,
      marginLeft: t.spacing.xs,
    },
  }));

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            ref={innerRef}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.textMuted}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surface,
                borderColor: error ? theme.colors.error : theme.colors.border,
                color: theme.colors.text,
              },
            ]}
            {...restProps}
          />
        )}
      />

      {error ? (
        <AppText variant="caption" color="error" style={styles.errorText}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
