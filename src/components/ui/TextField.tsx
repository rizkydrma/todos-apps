/**
 * Input form HIG: rounded rect + placeholder + optional caption label.
 * Integrasi react-hook-form (Controller). Tanpa floating label.
 */
import { useAppTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useState } from 'react';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { TextInput, type TextInputProps, View } from 'react-native';
import { AppText } from './AppText';

export type TextFieldProps<T extends FieldValues> = Omit<
  TextInputProps,
  'style' | 'placeholder'
> & {
  control: Control<T>;
  name: Path<T>;
  /** Caption di atas field (opsional). */
  label?: string;
  /** Placeholder di dalam input. */
  placeholder?: string;
  /** Pesan error di bawah field (dari formState.errors). */
  error?: string;
  /** Ref ke TextInput (untuk focus berantai antar field). */
  innerRef?: React.RefObject<TextInput | null>;
};

/**
 * Field terikat react-hook-form.
 * Props TextInput lain (secureTextEntry, keyboardType, …) diteruskan lewat rest.
 */
export function TextField<T extends FieldValues>({
  control,
  name,
  error,
  innerRef,
  label,
  placeholder,
  onFocus,
  onBlur: onBlurProp,
  ...restProps
}: TextFieldProps<T>) {
  const { theme } = useAppTheme();
  const [focused, setFocused] = useState(false);

  const styles = useThemedStyles((t) => ({
    container: {
      width: '100%' as const,
      marginTop: t.spacing.md,
    },
    caption: {
      marginBottom: t.spacing.xs,
      marginLeft: t.spacing.xs,
    },
    input: {
      minHeight: t.size.controlHeight,
      borderWidth: 1,
      borderRadius: t.radius.lg,
      paddingHorizontal: t.spacing.md,
      fontSize: t.fontSize.md,
      paddingVertical: t.spacing.sm,
    },
    errorText: {
      marginTop: t.spacing.xs,
      marginLeft: t.spacing.xs,
    },
  }));

  const borderColor = error
    ? theme.colors.destructive
    : focused
      ? theme.colors.primary
      : theme.colors.separator;

  return (
    <View style={styles.container}>
      {label ? (
        <AppText
          variant="caption"
          color="secondaryLabel"
          style={styles.caption}
        >
          {label}
        </AppText>
      ) : null}

      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur: onFieldBlur, value } }) => (
          <TextInput
            ref={innerRef}
            value={value == null ? '' : String(value)}
            onChangeText={onChange}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.placeholderText}
            accessibilityLabel={label ?? placeholder}
            {...restProps}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onFieldBlur();
              onBlurProp?.(e);
            }}
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.tertiarySystemFill,
                borderColor,
                color: theme.colors.label,
              },
            ]}
          />
        )}
      />

      {error ? (
        <AppText variant="caption" color="destructive" style={styles.errorText}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
