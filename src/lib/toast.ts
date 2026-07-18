/**
 * Toast imperative API (zero dependency) — bisa dipanggil dari hook / non-React.
 *
 * Pola: module store + subscribe. UI host (`ToastHost`) render di root layout.
 *
 *   import { toast } from '@/lib/toast';
 *   toast.success('Kode dikirim');
 *   toast.error('Login gagal', { title: 'Error' });
 */

export type ToastVariant = 'success' | 'error' | 'info';

export type ToastInput = {
  /** Isi utama toast. */
  message: string;
  /** Judul opsional di atas message. */
  title?: string;
  /** Durasi tampil (ms). Default: success/info 3200, error 4200. */
  duration?: number;
};

export type ToastItem = ToastInput & {
  id: string;
  variant: ToastVariant;
  duration: number;
};

type Listener = (items: ToastItem[]) => void;

const DEFAULT_DURATION: Record<ToastVariant, number> = {
  success: 3200,
  error: 4200,
  info: 3200,
};

/** Maksimum toast yang ditumpuk; yang lama di-drop dari atas. */
const MAX_VISIBLE = 3;

let items: ToastItem[] = [];
const listeners = new Set<Listener>();
const dismissTimers = new Map<string, ReturnType<typeof setTimeout>>();

function emit() {
  const snapshot = items.slice();
  listeners.forEach((listener) => listener(snapshot));
}

function nextId(): string {
  return `toast_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function clearTimer(id: string) {
  const timer = dismissTimers.get(id);
  if (timer) {
    clearTimeout(timer);
    dismissTimers.delete(id);
  }
}

function scheduleDismiss(id: string, duration: number) {
  clearTimer(id);
  if (duration <= 0) return;
  const timer = setTimeout(() => {
    dismissTimers.delete(id);
    toast.dismiss(id);
  }, duration);
  dismissTimers.set(id, timer);
}

function push(variant: ToastVariant, input: ToastInput | string) {
  const normalized: ToastInput =
    typeof input === 'string' ? { message: input } : input;

  const message = normalized.message.trim();
  if (!message) return;

  const item: ToastItem = {
    id: nextId(),
    variant,
    message,
    title: normalized.title?.trim() || undefined,
    duration: normalized.duration ?? DEFAULT_DURATION[variant],
  };

  items = [...items, item].slice(-MAX_VISIBLE);
  emit();
  scheduleDismiss(item.id, item.duration);
}

/**
 * API global toast. Aman dipanggil di luar komponen React.
 * Tanpa host terpasang, item tetap ter-push tapi tidak terlihat.
 */
export const toast = {
  success(input: ToastInput | string) {
    push('success', input);
  },
  error(input: ToastInput | string) {
    push('error', input);
  },
  info(input: ToastInput | string) {
    push('info', input);
  },
  /** Hapus satu toast, atau semua jika `id` diabaikan. */
  dismiss(id?: string) {
    if (id == null) {
      items.forEach((item) => clearTimer(item.id));
      items = [];
      emit();
      return;
    }
    clearTimer(id);
    const next = items.filter((item) => item.id !== id);
    if (next.length === items.length) return;
    items = next;
    emit();
  },
};

/**
 * Subscribe ke daftar toast aktif. Dipakai `ToastHost`.
 * @returns unsubscribe
 */
export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  listener(items.slice());
  return () => {
    listeners.delete(listener);
  };
}
