/** Compatibility re-exports — prefer importing from `@/lib/auth-session`. */
export {
  getAccessToken,
  getRefreshToken,
  clearSession,
  persistSession,
} from '@/lib/auth-session';
