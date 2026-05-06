import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import Constants from 'expo-constants';
import {
  readAccessToken,
  readRefreshToken,
  writeAccessToken,
  useAuthStore,
} from '../store/auth.store';

type AppConfig = { apiUrl?: string };
const extra = (Constants.expoConfig?.extra ?? {}) as AppConfig;

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? extra.apiUrl ?? 'http://localhost:3000';

function create(baseURL: string): AxiosInstance {
  const instance = axios.create({
    baseURL,
    timeout: 15_000,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  });

  instance.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    const token = await readAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  let refreshPromise: Promise<string | null> | null = null;

  instance.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
      const original = error.config as AxiosRequestConfig & { _retry?: boolean } | undefined;

      if (error.response?.status !== 401 || !original || original._retry) {
        return Promise.reject(error);
      }

      original._retry = true;

      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const newToken = await refreshPromise;

      if (!newToken) {
        await useAuthStore.getState().clearSession();
        return Promise.reject(error);
      }

      original.headers = { ...(original.headers ?? {}), Authorization: `Bearer ${newToken}` };
      return instance(original);
    },
  );

  return instance;
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await readRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await axios.post<{ access_token: string; refresh_token: string }>(
      `${API_BASE}/api/v1/auth/refresh`,
      { refresh_token: refreshToken },
      { timeout: 10_000 },
    );
    await writeAccessToken(res.data.access_token);
    await useAuthStore.getState().updateAccessToken(res.data.access_token);
    return res.data.access_token;
  } catch {
    return null;
  }
}

export const apiClient = create(API_BASE);
// Alias — toutes les routes auth passent par le gateway (/api/v1/auth/*)
export const authClient = apiClient;
