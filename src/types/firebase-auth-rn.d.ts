/**
 * Augment type `firebase/auth` untuk export RN-only.
 *
 * Runtime: Metro resolve `@firebase/auth` ke bundle `react-native` yang
 * mengekspor `getReactNativePersistence`. Entry types default (web) tidak
 * menyertakannya, sehingga TS mengeluh tanpa deklarasi ini.
 */
import type { Persistence, ReactNativeAsyncStorage } from 'firebase/auth';

declare module 'firebase/auth' {
  /**
   * Persistence Firebase Auth yang membungkus AsyncStorage (React Native).
   * Dipakai di `initializeAuth({ persistence })`.
   */
  export function getReactNativePersistence(
    storage: ReactNativeAsyncStorage
  ): Persistence;
}
