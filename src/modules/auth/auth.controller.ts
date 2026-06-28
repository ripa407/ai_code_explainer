import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { AuthService } from './auth.service';

function setRefreshTokenCookie(res: Response, refreshToken: string) {
  const isProd = process.env.NODE_ENV === 'production';

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 1000 * 60 * 60 * 24 * 30,
  });
}

function buildAuthResponse(result: {
  user: unknown;
  accessToken: string;
  refreshToken: string;
}) {
  return {
    user: result.user,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  };
}

const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await AuthService.loginWithCredentials(email, password);

  setRefreshTokenCookie(res, result.refreshToken);

  return sendResponse(
    res,
    httpStatus.OK,
    'Login successful',
    buildAuthResponse(result),
  );
});

const socialSync = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.syncSocialUser(req.body);

  setRefreshTokenCookie(res, result.refreshToken);

  return sendResponse(
    res,
    httpStatus.OK,
    'Social account synced successfully',
    buildAuthResponse(result),
  );
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken as string | undefined;

  if (!token) {
    return sendResponse(res, httpStatus.UNAUTHORIZED, 'Refresh token is required', null);
  }

  const result = await AuthService.refreshAccessToken(token);

  return sendResponse(res, httpStatus.OK, 'Token refreshed successfully', result);
});

const logout = catchAsync(async (_req: Request, res: Response) => {
  res.clearCookie('refreshToken', {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  return sendResponse(res, httpStatus.OK, 'Logged out successfully', null);
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.forgotPassword(req.body.email);

  return sendResponse(res, httpStatus.OK, result.message, null);
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;
  const result = await AuthService.resetPassword(email, otp, newPassword);

  return sendResponse(res, httpStatus.OK, 'Password reset successfully', result);
});

export const AuthController = {
  login,
  socialSync,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
};
