import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { User } from '../types/user.types';
import type { AuthTokens } from '../types/auth.types';

const ACCESS_TOKEN_KEY = 'yobbul.access_token';
const REFRESH_TOKEN_KEY = 'yobbul.refresh_token';
const USER_KEY = 'yobbul.user';

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  hydrate: () => Promise<void>;
  setSession: (tokens: AuthTokens, user: User) => Promise<void>;
  clearSession: () => Promise<void>;
  updateAccessToken: (token: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: true,
  isAuthenticated: false,

  hydrate: async () => {
    const [accessToken, refreshToken, userJson] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.getItemAsync(USER_KEY),
    ]);

    set({
      accessToken,
      refreshToken,
      user: userJson ? (JSON.parse(userJson) as User) : null,
      isAuthenticated: Boolean(accessToken && refreshToken),
      isLoading: false,
    });
  },

  setSession: async (tokens, user) => {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.access_token),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refresh_token),
      SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
    ]);
    set({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  clearSession: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
    ]);
    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  updateAccessToken: async (token: string) => {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
    set({ accessToken: token });
  },
}));

// Non-hook accessor for use in axios interceptors
export async function readAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}
export async function readRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}
export async function writeAccessToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
}
