/**
 * Hook Google Sign-In native (Android/iOS) + exchange ke session backend.
 *
 * Alur lengkap:
 * 1. GoogleSignin.signIn() → dapat Google OAuth idToken
 * 2. Tukar ke Firebase (signInWithCredential) → Firebase user
 * 3. Ambil Firebase ID token (iss: securetoken.google.com/...)
 * 4. POST /auth/google dengan token Firebase (bukan raw Google OAuth)
 * 5. commitSession + navigate home
 *
 * webClientId di configure() harus Web client dari Google Cloud Console.
 */
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/features/auth/api/auth.api';
import type { AuthSession } from '@/features/auth/types';
import { getApiErrorMessage } from '@/lib/api-error';
import { auth } from '@/lib/firebase';
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { Alert } from 'react-native';

// Konfigurasi sekali di load module (webClientId = OAuth Web client)
GoogleSignin.configure({
  webClientId:
    '244150983370-bdcj1aq5b9el7s5fi6p8fc6egc17hf1l.apps.googleusercontent.com',
});

/**
 * Mutation tanpa argumen: googleSignIn.mutate()
 * Backend /auth/google mengharapkan Firebase ID token, bukan Google idToken mentah.
 */
export const useGoogleSignIn = () => {
  const router = useRouter();
  const { commitSession } = useAuth();

  return useMutation({
    mutationFn: async (): Promise<AuthSession> => {
      // Pastikan Play Services ada (Android)
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      const response = await GoogleSignin.signIn();

      if (!isSuccessResponse(response) || !response.data.idToken) {
        throw new Error('Google Sign-In gagal: idToken tidak tersedia');
      }

      // Google idToken → kredensial Firebase → user Firebase
      const credential = GoogleAuthProvider.credential(response.data.idToken);
      const { user } = await signInWithCredential(auth, credential);
      // Token yang dikirim ke API kita = JWT Firebase
      const firebaseIdToken = await user.getIdToken();

      return authApi.google(firebaseIdToken);
    },

    onSuccess: async (session) => {
      await commitSession(session);
      router.replace('/(main)/home');
    },

    onError: (error: Error) => {
      // User cancel / masih proses → jangan tampil Alert
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.SIGN_IN_CANCELLED:
          case statusCodes.IN_PROGRESS:
            return;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            Alert.alert('Error', 'Google Play Services tidak tersedia');
            return;
          default:
            break;
        }
      }
      Alert.alert('Login gagal', getApiErrorMessage(error));
    },
  });
};
