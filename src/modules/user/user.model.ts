import { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';
import { IUser, UserModel } from './user.interface';

const userSchema = new Schema<IUser, UserModel>(
  {
    role: {
      type: String,
      enum: ['STUDENT', 'ADMIN', 'SUPER_ADMIN'],
      default: 'STUDENT',
    },
    name: {
      type: String,
      trim: true,
    },
    age: {
      type: Number,
      min: 0,
    },
    otp: {
      type: String,
    },
    otpExpiresAt: {
      type: Date,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    avatar: {
      type: String,
      trim: true,
    },
    provider: {
      type: String,
      enum: ['credentials', 'google', 'github'],
      default: 'credentials',
    },
    googleId: {
      type: String,
      trim: true,
    },
    githubId: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.pre('save', async function () {
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

userSchema.statics.isUserExistsByEmail = async function (email: string) {
  return this.findOne({ email: email.toLowerCase().trim() }).select('+password');
};

export const User = model<IUser, UserModel>('User', userSchema);
