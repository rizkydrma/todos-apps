/**
 * Shared destructive confirmation (ADR-0008: confirm every delete).
 * Promise resolves true jika user menekan destructive button.
 */
import { Alert } from 'react-native';

export type ConfirmDestructiveOptions = {
  title: string;
  message: string;
  /** Label tombol hapus. Default: Hapus */
  confirmLabel?: string;
  cancelLabel?: string;
};

/**
 * Tampilkan Alert konfirmasi. Resolve true hanya jika user confirm.
 */
export function confirmDestructive(
  options: ConfirmDestructiveOptions
): Promise<boolean> {
  const {
    title,
    message,
    confirmLabel = 'Hapus',
    cancelLabel = 'Batal',
  } = options;

  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
      {
        text: confirmLabel,
        style: 'destructive',
        onPress: () => resolve(true),
      },
    ]);
  });
}
