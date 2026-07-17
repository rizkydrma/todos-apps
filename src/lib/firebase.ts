/**
 * Inisialisasi Firebase App + Auth (client).
 *
 * Dipakai untuk alur Google Sign-In:
 * Google idToken → Firebase credential → Firebase ID token → dikirim ke backend /auth/google.
 *
 * Config ini harus cocok dengan project Firebase di google-services.json.
 */
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyCNPYj2caDjuElaADRRq9rbyFmlPoK4WJ8',
  authDomain: 'todos-c1b87.firebaseapp.com',
  projectId: 'todos-c1b87',
  storageBucket: 'todos-c1b87.firebasestorage.app',
  messagingSenderId: '244150983370',
  appId: '1:244150983370:android:c5d7c4e66cc542a256b233',
};

const app = initializeApp(firebaseConfig);

/** Instance Firebase Auth — dipakai signInWithCredential di useGoogleSignIn. */
export const auth = getAuth(app);
