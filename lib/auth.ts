import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import dbConnect from "./db"
import { User } from "../models/User"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username / Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        await dbConnect()

        const adminExists = await User.findOne({ role: "admin" }).lean();
        if (!adminExists && credentials.username === "admin" && credentials.password === "SKSAdmin@2024") {
            const hashedPassword = await bcrypt.hash("SKSAdmin@2024", 12);
            await User.create({
              name: "SKS Admin",
              username: "admin",
              email: "admin@sksagency.com",
              password: hashedPassword,
              role: "admin",
              needsPasswordChange: true
            });
        }

        const user = await User.findOne({
          $or: [
            { email: credentials.username },
            { username: credentials.username }
          ]
        }).select('+password').lean() as any

        if (!user || !user.password) {
          return null
        }

        const isValid = await bcrypt.compare(credentials.password as string, user.password)

        if (!isValid) {
          return null
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          needsPasswordChange: user.needsPasswordChange
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role as string
        token.id = user.id as string
        token.needsPasswordChange = user.needsPasswordChange as boolean
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role as string
        session.user.id = token.id as string
        session.user.needsPasswordChange = token.needsPasswordChange as boolean
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
})
