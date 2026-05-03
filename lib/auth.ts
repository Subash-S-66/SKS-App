import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import connectDB from "./db";
import { User } from "../models/User";
import { LoginAttempt } from "../models/LoginAttempt";
import bcrypt from "bcrypt";

const MAX_ATTEMPTS = 5;

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        await connectDB();

        const ip = req?.headers?.["x-forwarded-for"] || "127.0.0.1";

        // Check rate limit
        const attempts = await LoginAttempt.countDocuments({
          ip,
          email: credentials.email,
        });

        if (attempts >= MAX_ATTEMPTS) {
          throw new Error("Too many login attempts. Please try again later.");
        }

        const user = await User.findOne({ email: credentials.email }).select("+password").lean();

        if (!user) {
          // Record failed attempt
          await LoginAttempt.create({ ip, email: credentials.email });
          throw new Error("Invalid email or password");
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.password || ""
        );

        if (!isValidPassword) {
          // Record failed attempt
          await LoginAttempt.create({ ip, email: credentials.email });
          throw new Error("Invalid email or password");
        }

        // Return a safe user object
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
};
