export type UserRole = 'client' | 'driver' | 'admin' | 'super_admin';

export interface User {
  id: string;
  phone: string;
  first_name: string;
  last_name: string;
  email: string | null;
  avatar_url: string | null;
  yobbul_credits: number;
  is_verified: boolean;
  roles: UserRole[];
  created_at: string;
}
