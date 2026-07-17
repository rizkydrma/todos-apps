import { auth } from '@/lib/firebase';
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { useMutation } from '@tanstack/react-query';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';

// Web client ID (OAuth client_type 3) from Firebase / google-services.json
GoogleSignin.configure({
  webClientId:
    '244150983370-bdcj1aq5b9el7s5fi6p8fc6egc17hf1l.apps.googleusercontent.com',
});

export const useGoogleSignIn = () => {
  return useMutation({
    mutationFn: async () => {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      const response = await GoogleSignin.signIn();

      if (!isSuccessResponse(response) || !response.data.idToken) {
        throw new Error('Google Sign-In gagal: idToken tidak tersedia');
      }

      const credential = GoogleAuthProvider.credential(response.data.idToken);
      const { user } = await signInWithCredential(auth, credential);
      return user;
    },

    onSuccess: (user) => {
      console.log('✅ Login Google berhasil:', user.email);
    },

    onError: (error: Error) => {
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.SIGN_IN_CANCELLED:
            console.log('Google Sign-In dibatalkan user');
            return;
          case statusCodes.IN_PROGRESS:
            console.log('Google Sign-In sedang berjalan');
            return;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            console.error('Google Play Services tidak tersedia');
            return;
          default:
            break;
        }
      }

      console.error('❌ Google Sign In Error:', error.message);
    },
  });
};
