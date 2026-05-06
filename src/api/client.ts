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

type AppConfig = { apiUrl?: string; authUrl?: string; ordersUrl?: string; driversUrl?: string };
const extra = (Constants.expoConfig?.extra ?? {}) as AppConfig;

const AUTH_BASE    = process.env.EXPO_PUBLIC_AUTH_URL     ?? extra.authUrl    ?? 'http://localhost:3001';
const ORDERS_BASE  = process.env.EXPO_PUBLIC_ORDERS_URL   ?? extra.ordersUrl  ?? 'http://localhost:3002';
const DRIVERS_BASE = process.env.EXPO_PUBLIC_DRIVERS_URL  ?? extra.driversUrl ?? 'http://localhost:3006';

function create(baseURL: string): AxiosInstance {
  const instance = axios.create({
    baseURL,
    timeout: 15_000,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  });

  // ── Request interceptor: inject JWT ────────────────────────────────────────
  instance.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    const token = await readAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // ── Response interceptor: auto-refresh on 401 ──────────────────────────────
  let refreshPromise: Promise<string | null> | null = null;

  instance.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
      const original = error.config as AxiosRequestConfig & { _retry?: boolean } | undefined;

      if (error.response?.status !== 401 || !original || original._retry) {
        return Promise.reject(error);
      }

      original._retry = true;

      // Single-flight refresh: share the same promise across concurrent 401s
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

      // Retry with new token
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
      `${AUTH_BASE}/api/v1/auth/refresh`,
      { refresh_token: refreshToken },
      { timeout: 10_000 },
    );
    await writeAccessToken(res.data.access_token);
    // The refresh response rotates the refresh_token too — update it
    await useAuthStore.getState().updateAccessToken(res.data.access_token);
    return res.data.access_token;
  } catch {
    return null;
  }
}

// One client per microservice — each carries the JWT interceptors
export const authClient    = create(AUTH_BASE);
export const ordersClient  = create(ORDERS_BASE);
export const driversClient = create(DRIVERS_BASE);
