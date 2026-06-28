import type { IUser } from '../modules/user/user.interface';

type UserDocument = IUser & { _id?: unknown; password?: string };

export function sanitizeUser(user: UserDocument | null | undefined) {
  if (!user) return null;

  const plainUser =
    user &&
    typeof user === 'object' &&
    'toObject' in user &&
    typeof (user as { toObject?: () => Record<string, unknown> }).toObject === 'function'
      ? (user as { toObject: () => Record<string, unknown> }).toObject()
      : { ...user };

  delete plainUser.password;
  delete plainUser.otp;
  delete plainUser.otpExpiresAt;

  return plainUser;
}
