/**
 * Inisialisasi Firebase App + Auth (client).
 *
 * Dipakai untuk alur Google Sign-In:
 * Google idToken → Firebase credential → Firebase ID token → dikirim ke backend /auth/google.
 *
 * Config ini harus cocok dengan project Firebase di google-services.json.
 *
 * Di React Native, Auth di-init dengan AsyncStorage persistence agar state
 * tidak hilang antar session dan warning "without providing AsyncStorage" hilang.
 * Session app sendiri tetap lewat SecureStore (`auth-session`); ini hanya persistence Firebase Auth.
 */
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  type Auth,
} from 'firebase/auth';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: 'AIzaSyCNPYj2caDjuElaADRRq9rbyFmlPoK4WJ8',
  authDomain: 'todos-c1b87.firebaseapp.com',
  projectId: 'todos-c1b87',
  storageBucket: 'todos-c1b87.firebasestorage.app',
  messagingSenderId: '244150983370',
  appId: '1:244150983370:android:c5d7c4e66cc542a256b233',
};

const app = initializeApp(firebaseConfig);

/**
 * Buat instance Auth sekali.
 * - Web: getAuth (browser persistence bawaan)
 * - Native: initializeAuth + AsyncStorage; fallback getAuth jika sudah di-init (hot reload)
 */
function createAuth(): Auth {
  if (Platform.OS === 'web') {
    return getAuth(app);
  }

  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
  } catch {
    // Auth sudah diinisialisasi (Fast Refresh / double import) — reuse instance yang ada.
    return getAuth(app);
  }
}

/** Instance Firebase Auth — dipakai signInWithCredential di useGoogleSignIn. */
export const auth = createAuth();
