/**
 * Re-export kompatibilitas (file lama).
 * Prefer impor langsung dari `@/lib/auth-session`.
 */
export {
  getAccessToken,
  getRefreshToken,
  clearSession,
  persistSession,
} from '@/lib/auth-session';
