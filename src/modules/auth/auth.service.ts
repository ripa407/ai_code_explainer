import httpStatus from 'http-status';
import bcrypt from 'bcrypt';
import AppError from '../../errors/AppError';
import { signAccessToken, signAuthTokens, verifyRefreshToken, type JwtPayload } from '../../lib/jwt';
import { sanitizeUser } from '../../utils/sanitizeUser';
import { sendOtpEmail } from '../../lib/email.service';
import { getOtpExpiryDate, isOtpExpired } from '../../lib/mailer';
import type { AuthProvider } from '../user/user.interface';
import { User } from '../user/user.model';

const OTP_EXPIRES_MINUTES = 10;

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

type SocialSyncInput = {
  email: string;
  name: string;
  avatar?: string;
  provider: Extract<AuthProvider, 'google' | 'github'>;
  googleId?: string;
  githubId?: string;
};

function buildJwtPayload(user: {
  _id?: unknown;
  id?: unknown;
  email: string;
  role: string;
  name?: string;
}): JwtPayload {
  const userId = user._id ?? user.id;

  return {
    id: String(userId),
    email: user.email,
    role: user.role,
    name: user.name?.trim() || user.email,
  };
}

const loginWithCredentials = async (email: string, password: string) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.isUserExistsByEmail(normalizedEmail);

  if (!user) {
    throw new AppError('Invalid credentials', httpStatus.UNAUTHORIZED);
  }

  if (!user.password) {
    throw new AppError(
      'This account uses social login. Please sign in with Google or GitHub.',
      httpStatus.BAD_REQUEST,
    );
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    throw new AppError('Invalid credentials', httpStatus.UNAUTHORIZED);
  }

  if (!user.isVerified) {
    throw new AppError('Please verify your email before logging in', httpStatus.FORBIDDEN);
  }

  const tokens = signAuthTokens(buildJwtPayload(user));

  return {
    user: sanitizeUser(user),
    ...tokens,
  };
};

const syncSocialUser = async (payload: SocialSyncInput) => {
  const email = payload.email.toLowerCase().trim();
  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      email,
      name: payload.name.trim(),
      avatar: payload.avatar,
      provider: payload.provider,
      googleId: payload.provider === 'google' ? payload.googleId : undefined,
      githubId: payload.provider === 'github' ? payload.githubId : undefined,
      isVerified: true,
      role: 'STUDENT',
    });
  } else {
    user.name = user.name || payload.name.trim();
    user.avatar = payload.avatar || user.avatar;
    user.provider = payload.provider;

    if (payload.provider === 'google' && payload.googleId) {
      user.googleId = payload.googleId;
    }

    if (payload.provider === 'github' && payload.githubId) {
      user.githubId = payload.githubId;
    }

    user.isVerified = true;
    await user.save();
  }

  const tokens = signAuthTokens(buildJwtPayload(user));

  return {
    user: sanitizeUser(user),
    ...tokens,
  };
};

const refreshAccessToken = async (refreshToken: string) => {
  try {
    const decoded = verifyRefreshToken(refreshToken);

    return {
      accessToken: signAccessToken({
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        name: decoded.name,
      }),
    };
  } catch {
    throw new AppError('Invalid or expired refresh token', httpStatus.UNAUTHORIZED);
  }
};

const forgotPassword = async (email: string) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  if (!user || !user.password) {
    return {
      message: 'If an account exists for this email, a reset OTP has been sent.',
    };
  }

  const otp = generateOtp();
  user.otp = otp;
  user.otpExpiresAt = getOtpExpiryDate(OTP_EXPIRES_MINUTES);
  await user.save();

  await sendOtpEmail(user.email, otp, 'reset', OTP_EXPIRES_MINUTES);

  return {
    message: 'If an account exists for this email, a reset OTP has been sent.',
  };
};

const resetPassword = async (email: string, otp: string, newPassword: string) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  if (!user) {
    throw new AppError('User not found', httpStatus.NOT_FOUND);
  }

  if (!user.password) {
    throw new AppError(
      'This account uses social login and cannot reset password here.',
      httpStatus.BAD_REQUEST,
    );
  }

  if (!user.otp || user.otp !== otp) {
    throw new AppError('Invalid OTP', httpStatus.BAD_REQUEST);
  }

  if (isOtpExpired(user.otpExpiresAt)) {
    throw new AppError('OTP has expired. Please request a new one.', httpStatus.BAD_REQUEST);
  }

  user.password = newPassword;
  user.otp = undefined;
  user.otpExpiresAt = undefined;
  await user.save();

  return sanitizeUser(user);
};

export const AuthService = {
  loginWithCredentials,
  syncSocialUser,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
};
