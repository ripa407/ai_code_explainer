import { sendMail } from './mailer';

type OtpEmailPurpose = 'verify' | 'reset';

const purposeCopy: Record<
  OtpEmailPurpose,
  { subject: string; title: string; description: string }
> = {
  verify: {
    subject: 'Verify your account',
    title: 'Email Verification',
    description: 'Use the OTP below to verify your account.',
  },
  reset: {
    subject: 'Reset your password',
    title: 'Password Reset',
    description: 'Use the OTP below to reset your password.',
  },
};

function buildOtpHtml(purpose: OtpEmailPurpose, otp: string, expiresInMinutes: number) {
  const copy = purposeCopy[purpose];

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2 style="margin-bottom: 8px;">${copy.title}</h2>
      <p>${copy.description}</p>
      <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px; margin: 24px 0;">${otp}</p>
      <p style="color: #6b7280;">This code expires in ${expiresInMinutes} minutes.</p>
      <p style="color: #6b7280;">If you did not request this, you can ignore this email.</p>
    </div>
  `;
}

export async function sendOtpEmail(
  to: string,
  otp: string,
  purpose: OtpEmailPurpose,
  expiresInMinutes = 10,
) {
  const copy = purposeCopy[purpose];

  await sendMail({
    to,
    subject: copy.subject,
    html: buildOtpHtml(purpose, otp, expiresInMinutes),
    text: `${copy.description} Your OTP is ${otp}. It expires in ${expiresInMinutes} minutes.`,
  });
}
