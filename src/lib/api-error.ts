/**
 * Helper mengekstrak pesan / kode error ramah-user dari error Axios / Error biasa.
 * Dipakai di hook login/register/Google/verify agar Alert menampilkan pesan backend.
 */
import { isAxiosError } from 'axios';

/** Bentuk body error standar Todo Service. */
type ErrorBody = {
  success?: boolean;
  error?: {
    code?: string;
    message?: string;
  };
};

/**
 * Ambil message terbaik dari error.
 * Urutan: error.message dari body API → message Axios → Error.message → fallback.
 *
 * @param error - apa pun yang di-throw (AxiosError, Error, unknown)
 * @param fallback - teks default kalau tidak ada message yang bisa dipakai
 */
export function getApiErrorMessage(
  error: unknown,
  fallback = 'Terjadi kesalahan. Coba lagi.'
): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as ErrorBody | undefined;
    if (data?.error?.message) {
      return data.error.message;
    }
    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

/**
 * Ambil application code dari envelope error backend (mis. EMAIL_NOT_VERIFIED).
 * Return null kalau bukan Axios error atau body tidak punya code.
 */
export function getApiErrorCode(error: unknown): string | null {
  if (!isAxiosError(error)) return null;
  const data = error.response?.data as ErrorBody | undefined;
  return data?.error?.code ?? null;
}
