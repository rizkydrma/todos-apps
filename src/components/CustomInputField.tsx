import { useAppTheme } from '@/context/ThemeContext';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';

interface CustomInputFieldProps<T extends FieldValues> extends Omit<
  TextInputProps,
  'style'
> {
  control: Control<T>;
  name: Path<T>;
  error?: string;
  innerRef?: React.RefObject<TextInput | null>;
}

export default function CustomInputField<T extends FieldValues>({
  control,
  name,
  error,
  innerRef,
  placeholder,
  ...restProps
}: CustomInputFieldProps<T>) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            ref={innerRef}
            placeholder={placeholder}
            placeholderTextColor={theme.textMuted}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            style={[
              styles.input,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                color: theme.text,
              },
              error ? { borderColor: theme.error } : null,
            ]}
            {...restProps}
          />
        )}
      />

      {error && (
        <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    padding: 14,
    borderRadius: 8,
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '500',
  },
});
