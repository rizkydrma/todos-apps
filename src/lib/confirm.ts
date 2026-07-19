/**
 * Konfirmasi destruktif — imperative API (ADR-0008).
 *
 * UI digambar ConfirmDialogHost di root (bukan Alert native).
 * Call site tidak berubah: `const ok = await confirmDestructive({...})`.
 *
 * Pola store + subscribe (sama seperti toast).
 */

export type ConfirmDestructiveOptions = {
  title: string;
  message: string;
  /** Label tombol aksi. Default: Hapus */
  confirmLabel?: string;
  cancelLabel?: string;
};

export type ConfirmRequest = ConfirmDestructiveOptions & {
  id: string;
  confirmLabel: string;
  cancelLabel: string;
  resolve: (value: boolean) => void;
};

type Listener = (request: ConfirmRequest | null) => void;

let current: ConfirmRequest | null = null;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((fn) => fn(current));
}

function nextId(): string {
  return `confirm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Subscribe UI host. Return unsubscribe.
 */
export function subscribeConfirm(listener: Listener): () => void {
  listeners.add(listener);
  listener(current);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Resolve request aktif (dari host) lalu clear.
 */
export function resolveConfirm(id: string, value: boolean): void {
  if (!current || current.id !== id) return;
  const { resolve } = current;
  current = null;
  emit();
  resolve(value);
}

/**
 * Tampilkan dialog konfirmasi. Resolve true hanya jika user confirm.
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

  // Jika masih ada request terbuka, tolak yang lama (fail-closed)
  if (current) {
    current.resolve(false);
    current = null;
  }

  return new Promise((resolve) => {
    current = {
      id: nextId(),
      title,
      message,
      confirmLabel,
      cancelLabel,
      resolve,
    };
    emit();
  });
}
