/**
 * String UI auth berbahasa Indonesia (terpusat, tanpa i18n framework).
 * Dipakai di verify-email screen, hook register/login/Google, Alert error codes.
 */

export const authCopy = {
  /** Judul & deskripsi screen verifikasi OTP. */
  verify: {
    title: 'Verifikasi Email',
    subtitle: (email: string) =>
      email
        ? `Masukkan kode 6 digit yang dikirim ke ${email}`
        : 'Masukkan kode 6 digit yang dikirim ke email Anda',
    codeLabel: 'Kode verifikasi',
    codeRequired: 'Kode wajib diisi',
    codeInvalid: 'Kode harus 6 digit angka',
    submit: 'Verifikasi',
    resend: 'Kirim ulang kode',
    resendCooldown: (seconds: number) => `Kirim ulang (${seconds}s)`,
    missingEmail: 'Email tidak ditemukan. Kembali ke login atau daftar ulang.',
    backToLogin: 'Kembali ke login',
  },

  /** Alert / pesan resend OTP. */
  resend: {
    successTitle: 'Kode dikirim',
    successBody:
      'Jika email terdaftar dan belum diverifikasi, kode baru sudah dikirim.',
    rateLimitedTitle: 'Terlalu sering',
    rateLimitedBody:
      'Tunggu sebentar sebelum meminta kode baru. Maksimal 5 kali per jam.',
    failTitle: 'Gagal kirim ulang',
  },

  /** Alert verifikasi gagal / sukses path lewat hook. */
  verifyAlert: {
    failTitle: 'Verifikasi gagal',
  },

  register: {
    failTitle: 'Registrasi gagal',
  },

  login: {
    failTitle: 'Login gagal',
  },

  google: {
    failTitle: 'Login gagal',
    playServices: 'Google Play Services tidak tersedia',
    /** 409: email sudah dipakai akun password — minta user login password. */
    emailRegisteredUsePassword:
      'Email ini sudah terdaftar dengan password. Silakan masuk pakai email dan password, lalu verifikasi email bila diminta.',
    /** 409: firebase_uid beda untuk email yang sama. */
    identityConflict:
      'Akun Google ini bentrok dengan data yang sudah ada. Hubungi dukungan atau gunakan metode login yang semula.',
  },

  /** Pesan ramah per application code (override message backend bila perlu). */
  errorCode: {
    EMAIL_NOT_VERIFIED:
      'Email belum diverifikasi. Masukkan kode OTP yang dikirim ke email Anda.',
    INVALID_OTP: 'Kode tidak valid. Periksa lagi atau minta kode baru.',
    OTP_EXPIRED: 'Kode sudah kedaluwarsa. Minta kode baru.',
    OTP_MAX_ATTEMPTS:
      'Terlalu banyak percobaan. Minta kode baru setelah menunggu.',
    RATE_LIMITED: 'Terlalu banyak permintaan. Coba lagi nanti.',
    EMAIL_REGISTERED_USE_PASSWORD:
      'Email ini sudah terdaftar dengan password. Silakan masuk pakai email dan password.',
    IDENTITY_CONFLICT:
      'Akun Google bentrok dengan data yang sudah ada. Hubungi dukungan.',
    EMAIL_ALREADY_REGISTERED: 'Email sudah terdaftar. Silakan login.',
  } as Record<string, string>,
} as const;

/**
 * Ambil copy ramah-user untuk application code, atau null jika tidak ada mapping.
 */
export function messageForAuthCode(
  code: string | null | undefined
): string | null {
  if (!code) return null;
  return authCopy.errorCode[code] ?? null;
}
