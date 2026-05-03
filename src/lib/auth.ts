import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import LoginAttempt from "@/models/LoginAttempt";

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000;

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }

        await dbConnect();

        const ipAddress = (req as any).headers?.["x-forwarded-for"] || "unknown-ip";

        let attemptRecord = await LoginAttempt.findOne({ ipAddress }).lean();

        if (attemptRecord && !!(attemptRecord.lockUntil && attemptRecord.lockUntil.getTime() > Date.now())) {
          throw new Error(`Too many attempts. Try again in ${Math.ceil((attemptRecord.lockUntil.getTime() - Date.now()) / 60000)} minutes.`);
        }

        const user = await User.findOne({ email: credentials.email.toLowerCase() }).select('+password').lean();

        if (!user || !user.isActive) {
          await LoginAttempt.updateOne(
            { ipAddress },
            {
              $inc: { attempts: 1 },
              $set: { lockUntil: attemptRecord?.attempts >= MAX_ATTEMPTS - 1 ? new Date(Date.now() + LOCKOUT_DURATION) : undefined }
            },
            { upsert: true }
          );
          throw new Error("Invalid email or password");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          await LoginAttempt.updateOne(
            { ipAddress },
            {
              $inc: { attempts: 1 },
              $set: { lockUntil: attemptRecord?.attempts >= MAX_ATTEMPTS - 1 ? new Date(Date.now() + LOCKOUT_DURATION) : undefined }
            },
            { upsert: true }
          );
          throw new Error("Invalid email or password");
        }

        if (attemptRecord) {
          await LoginAttempt.deleteOne({ ipAddress });
        }

        // Return a plain object, do not return mongoose document to avoid client-side JSON serialization issues
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          needsPasswordChange: user.needsPasswordChange,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
        token.needsPasswordChange = (user as any).needsPasswordChange;
      }

      if (trigger === "update" && session?.needsPasswordChange === false) {
        token.needsPasswordChange = false;
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
        (session.user as any).needsPasswordChange = token.needsPasswordChange;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_dev_only",
};
