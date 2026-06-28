import { Model } from 'mongoose';

export type UserRole = 'STUDENT' | 'ADMIN' | 'SUPER_ADMIN';

export type AuthProvider = 'credentials' | 'google' | 'github';

export interface IUser {
  role: UserRole;
  name?: string;
  age?: number;
  otp?: string;
  otpExpiresAt?: Date;
  isVerified?: boolean;
  phone?: string;
  email: string;
  avatar?: string;
  provider?: AuthProvider;
  googleId?: string;
  githubId?: string;
  password?: string;
}

export interface UserModel extends Model<IUser> {
  isUserExistsByEmail(email: string): Promise<IUser | null>;
}
