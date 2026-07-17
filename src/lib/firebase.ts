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
export const auth = getAuth(app);
