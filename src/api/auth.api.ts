import { authClient } from './client';
import type { VerifyOtpResponse, RequestOtpResponse } from '../types/auth.types';
import type { User } from '../types/user.types';

export const AuthApi = {
  async requestOtp(phone: string): Promise<RequestOtpResponse> {
    const res = await authClient.post<RequestOtpResponse>('/api/v1/auth/request-otp', { phone });
    return res.data;
  },

  async verifyOtp(phone: string, otp: string): Promise<VerifyOtpResponse> {
    const res = await authClient.post<VerifyOtpResponse>('/api/v1/auth/verify-otp', { phone, otp });
    return res.data;
  },

  async me(): Promise<User> {
    const res = await authClient.get<User>('/api/v1/auth/me');
    return res.data;
  },

  async logout(refreshToken: string): Promise<void> {
    await authClient.post('/api/v1/auth/logout', { refresh_token: refreshToken });
  },
};
