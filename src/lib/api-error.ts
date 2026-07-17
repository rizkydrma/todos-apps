import { isAxiosError } from 'axios';

type ErrorBody = {
  success?: boolean;
  error?: {
    code?: string;
    message?: string;
  };
};

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
