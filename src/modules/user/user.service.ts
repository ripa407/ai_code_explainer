import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import { IUser } from './user.interface';
import { User } from './user.model';
import { sanitizeUser } from '../../utils/sanitizeUser';
import { sendOtpEmail } from '../../lib/email.service';
import { getOtpExpiryDate, isOtpExpired } from '../../lib/mailer';

const OTP_EXPIRES_MINUTES = 10;

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const createUserIntoDB = async (payload: IUser) => {
  const exists = await User.findOne({
    $or: [
      { email: payload.email },
      ...(payload.phone ? [{ phone: payload.phone }] : []),
    ],
  });

  if (exists) {
    throw new AppError('Email or phone already exists', httpStatus.CONFLICT);
  }

  const otp = generateOtp();
  const otpExpiresAt = getOtpExpiryDate(OTP_EXPIRES_MINUTES);

  const user = await User.create({
    name: payload.name,
    age: payload.age,
    phone: payload.phone,
    email: payload.email,
    password: payload.password,
    role: 'STUDENT',
    provider: 'credentials',
    otp,
    otpExpiresAt,
    isVerified: false,
  });

  await sendOtpEmail(user.email, otp, 'verify', OTP_EXPIRES_MINUTES);

  return sanitizeUser(user);
};

const verifyOtp = async (email: string, otp: string) => {
  const user = await User.findOne({ email: email.toLowerCase().trim() });

  if (!user) {
    throw new AppError('User not found', httpStatus.NOT_FOUND);
  }

  if (!user.otp || user.otp !== otp) {
    throw new AppError('Invalid OTP', httpStatus.BAD_REQUEST);
  }

  if (isOtpExpired(user.otpExpiresAt)) {
    throw new AppError('OTP has expired. Please request a new one.', httpStatus.BAD_REQUEST);
  }

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpiresAt = undefined;
  await user.save();

  return sanitizeUser(user);
};

export const UserService = {
  createUserIntoDB,
  verifyOtp,
};
