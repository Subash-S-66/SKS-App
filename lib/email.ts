import nodemailer from "nodemailer";
import { EmailLog } from "@/models/EmailLog";
import connectDB from "./db";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // true for 465, false for other ports
  pool: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async ({
  to,
  subject,
  html,
  projectId,
  type,
  retries = 1,
}: {
  to: string;
  subject: string;
  html: string;
  projectId?: string;
  type: string;
  retries?: number;
}) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log("Email skipped: SMTP credentials not set.");
    return;
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || `"SKS Agency" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    await logEmail(to, subject, projectId, type, "sent");
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    if (retries > 0) {
      console.log(`Retrying email to ${to}...`);
      await sendEmail({ to, subject, html, projectId, type, retries: retries - 1 });
    } else {
      await logEmail(to, subject, projectId, type, "failed");
    }
  }
};

async function logEmail(recipient: string, subject: string, projectId: string | undefined, type: string, status: "sent" | "failed") {
  try {
    await connectDB();
    await EmailLog.create({
      recipient,
      subject,
      projectId,
      type,
      status,
    });
  } catch (error) {
    console.error("Failed to log email to database:", error);
  }
}