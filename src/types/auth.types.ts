import type { User } from './user.types';

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface VerifyOtpResponse extends AuthTokens {
  user: User;
}

export interface RequestOtpResponse {
  message: string;
}
