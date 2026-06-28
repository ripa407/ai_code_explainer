import nodemailer from 'nodemailer';

type MailConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  fromName: string;
};

function getMailConfig(): MailConfig {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.MAIL_FROM ?? user;
  const fromName = process.env.MAIL_FROM_NAME ?? 'Server Setup';

  if (!host || !user || !pass || !from) {
    throw new Error(
      'SMTP is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS, and MAIL_FROM in .env',
    );
  }

  return { host, port, user, pass, from, fromName };
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    const config = getMailConfig();

    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });
  }

  return transporter;
}

export type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendMail(input: SendMailInput) {
  const config = getMailConfig();
  const transport = getTransporter();

  await transport.sendMail({
    from: `"${config.fromName}" <${config.from}>`,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });
}

export function getOtpExpiryDate(minutes = 10) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

export function isOtpExpired(expiresAt?: Date | null) {
  if (!expiresAt) return true;
  return expiresAt.getTime() < Date.now();
}
