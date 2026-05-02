import nodemailer from 'nodemailer';
import dbConnect from './db';
import { EmailLog } from '@/models/EmailLog';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  pool: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail({
  to,
  subject,
  html,
  projectId,
  type
}: {
  to: string | string[];
  subject: string;
  html: string;
  projectId?: string;
  type: string;
}) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("SMTP credentials not set. Skipping email send:", subject);
    return;
  }

  await dbConnect();

  const recipients = Array.isArray(to) ? to : [to];

  for (const recipient of recipients) {
    if (!recipient) continue;

    let attempt = 0;
    const maxAttempts = 2;
    let success = false;
    let lastError = null;

    while (attempt < maxAttempts && !success) {
      attempt++;
      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || `"SKS Agency" <${process.env.SMTP_USER}>`,
          to: recipient,
          subject,
          html,
        });
        success = true;
      } catch (error) {
        lastError = error;
        console.error(`Email attempt ${attempt} failed for ${recipient}:`, error);
      }
    }

    try {
      await EmailLog.create({
        recipient,
        subject,
        projectId,
        type,
        status: success ? 'sent' : 'failed',
        error: success ? undefined : (lastError as any)?.message || 'Unknown error'
      });
    } catch (dbError) {
      console.error("Failed to log email to DB:", dbError);
    }
  }
}
