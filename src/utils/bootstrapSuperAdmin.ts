import httpStatus from 'http-status';
import AppError from '../errors/AppError';
import { User } from '../modules/user/user.model';

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new AppError(`${name} is required`, httpStatus.INTERNAL_SERVER_ERROR);
  }
  return value;
}

export async function bootstrapSuperAdmin() {
  const email = requireEnv('SUPER_ADMIN_EMAIL').toLowerCase().trim();
  const password = requireEnv('SUPER_ADMIN_PASSWORD');

  const existing = await User.findOne({ role: 'SUPER_ADMIN' });
  if (existing) {
    // In dev, keep credentials aligned with .env after the first bootstrap.
    if (
      process.env.NODE_ENV !== 'production' &&
      existing.email === email
    ) {
      existing.password = password;
      existing.isVerified = true;
      await existing.save();
    }
    return;
  }

  await User.create({
    role: 'SUPER_ADMIN',
    name: 'Super Admin',
    age: 99,
    phone: '0000000000',
    email,
    password,
    provider: 'credentials',
    isVerified: true,
  });
}

