import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import LoginAttempt from "@/models/LoginAttempt";

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

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

        // Pass an IP to login attempts. In Next.js app router API route, req has a limited set of headers.
        const ipAddress = (req as any).headers?.["x-forwarded-for"] || "unknown-ip";

        let attemptRecord = await LoginAttempt.findOne({ ipAddress });

        if (attemptRecord && attemptRecord.isLocked()) {
          throw new Error(`Too many attempts. Try again in ${Math.ceil((attemptRecord.lockUntil!.getTime() - Date.now()) / 60000)} minutes.`);
        }

        const user = await User.findOne({ email: credentials.email.toLowerCase() });

        if (!user || !user.isActive) {
          // Record failed attempt
          if (attemptRecord) {
            attemptRecord.attempts += 1;
            if (attemptRecord.attempts >= MAX_ATTEMPTS) {
              attemptRecord.lockUntil = new Date(Date.now() + LOCKOUT_DURATION);
            }
            await attemptRecord.save();
          } else {
            await LoginAttempt.create({ ipAddress, attempts: 1 });
          }
          throw new Error("Invalid email or password");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          if (attemptRecord) {
            attemptRecord.attempts += 1;
            if (attemptRecord.attempts >= MAX_ATTEMPTS) {
              attemptRecord.lockUntil = new Date(Date.now() + LOCKOUT_DURATION);
            }
            await attemptRecord.save();
          } else {
            await LoginAttempt.create({ ipAddress, attempts: 1 });
          }
          throw new Error("Invalid email or password");
        }

        // Reset attempts on successful login
        if (attemptRecord) {
          await LoginAttempt.deleteOne({ ipAddress });
        }

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

      // Update token when password change is detected
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
    maxAge: 8 * 60 * 60, // 8 hours as requested
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_dev_only",
};
