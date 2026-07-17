import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const apiClient = axios.create({
  baseURL: 'https://todo-service.rizky-darmarazak.workers.dev',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// REQUEST INTERCEPTOR
apiClient.interceptors.request.use(
  (config: CustomAxiosRequestConfig) => {
    // Ambil token dari storage (nanti kita pakai MMKV atau SecureStore)
    const token = getTokenFromStorage(); // fungsi yang akan kamu buat

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR
apiClient.interceptors.response.use(
  (response) => response, // Langsung return kalau sukses

  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    // Handle 401 Unauthorized + refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // TODO: Panggil refresh token logic di sini
        const newToken = await refreshAccessToken();
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest); // Ulang request yang gagal
        }
      } catch (refreshError) {
        console.log(refreshError);
        // Kalau refresh gagal → logout user
        await logoutUser();
      }
    }

    return Promise.reject(error);
  }
);

// Helper functions (buat di file terpisah nanti)
const getTokenFromStorage = (): string | null => {
  // nanti pakai MMKV atau expo-secure-store
  return null; // sementara
};

const refreshAccessToken = async (): Promise<string | null> => {
  // Implement refresh logic nanti
  return null;
};

const logoutUser = async () => {
  // Clear storage + redirect ke login
  console.log('User logged out');
};

export default apiClient;
