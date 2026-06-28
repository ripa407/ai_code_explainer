import jwt from 'jsonwebtoken';
import httpStatus from 'http-status';
import AppError from '../errors/AppError';

export type JwtPayload = {
  id: string;
  email: string;
  role: string;
  name: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new AppError(`${name} is not configured`, httpStatus.INTERNAL_SERVER_ERROR);
  }
  return value;
}

export function signAccessToken(payload: JwtPayload) {
  return jwt.sign(payload, requireEnv('JWT_ACCESS_SECRET') as jwt.Secret, {
    expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ?? '7d') as jwt.SignOptions['expiresIn'],
  });
}

export function signRefreshToken(payload: JwtPayload) {
  return jwt.sign(payload, requireEnv('JWT_REFRESH_SECRET') as jwt.Secret, {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? '30d') as jwt.SignOptions['expiresIn'],
  });
}

export function signAuthTokens(payload: JwtPayload): AuthTokens {
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, requireEnv('JWT_ACCESS_SECRET') as jwt.Secret) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, requireEnv('JWT_REFRESH_SECRET') as jwt.Secret) as JwtPayload;
}
