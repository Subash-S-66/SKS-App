import nodemailer from 'nodemailer';
import EmailLog from '@/models/EmailLog';
import dbConnect from './db';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  pool: true,
});

export const sendEmail = async (
  to: string | string[],
  subject: string,
  html: string,
  projectId: string,
  type: string
) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log("Email sending skipped - SMTP credentials not configured");
    return;
  }

  const recipients = Array.isArray(to) ? to : [to];

  for (const recipient of recipients) {
    if (!recipient) continue;

    const mailOptions = {
      from: process.env.SMTP_FROM || `"SKS Agency" <noreply@sksagency.com>`,
      to: recipient,
      subject,
      html,
    };

    let status: "sent" | "failed" = "failed";

    try {
      await transporter.sendMail(mailOptions);
      status = "sent";
    } catch (error) {
      console.error(`Failed to send email to ${recipient}`, error);
      // Simple retry logic
      try {
        console.log(`Retrying email to ${recipient}...`);
        await transporter.sendMail(mailOptions);
        status = "sent";
      } catch (retryError) {
        console.error(`Retry failed for ${recipient}`, retryError);
      }
    }

    try {
      await dbConnect();
      await EmailLog.create({
        recipient,
        subject,
        projectId,
        type,
        status,
      });
    } catch (dbError) {
      console.error("Failed to log email", dbError);
    }
  }
};
