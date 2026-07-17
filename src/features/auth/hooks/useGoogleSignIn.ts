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

GoogleSignin.configure({
  webClientId:
    '244150983370-bdcj1aq5b9el7s5fi6p8fc6egc17hf1l.apps.googleusercontent.com',
});

/**
 * Google native sheet → Firebase credential exchange → backend session.
 *
 * Backend `/auth/google` expects a **Firebase ID token**
 * (`iss: https://securetoken.google.com/todos-c1b87`), not the raw Google
 * OAuth idToken (`iss: https://accounts.google.com`).
 */
export const useGoogleSignIn = () => {
  const router = useRouter();
  const { commitSession } = useAuth();

  return useMutation({
    mutationFn: async (): Promise<AuthSession> => {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      const response = await GoogleSignin.signIn();

      if (!isSuccessResponse(response) || !response.data.idToken) {
        throw new Error('Google Sign-In gagal: idToken tidak tersedia');
      }

      // Exchange Google idToken → Firebase user, then send Firebase JWT to API.
      const credential = GoogleAuthProvider.credential(response.data.idToken);
      const { user } = await signInWithCredential(auth, credential);
      const firebaseIdToken = await user.getIdToken();

      return authApi.google(firebaseIdToken);
    },

    onSuccess: async (session) => {
      await commitSession(session);
      router.replace('/(main)/home');
    },

    onError: (error: Error) => {
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
