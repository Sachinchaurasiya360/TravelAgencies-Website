import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        code: { label: "OTP", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.code) {
          return null;
        }

        const email = credentials.email as string;
        const code = credentials.code as string;

        // Verify OTP
        const otp = await prisma.loginOtp.findFirst({
          where: {
            email,
            code,
            expiresAt: { gt: new Date() },
          },
        });

        if (!otp) {
          return null;
        }

        // Delete used OTP
        await prisma.loginOtp.deleteMany({ where: { email } });

        // Look up user
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.isActive || user.role === "DRIVER") {
          return null;
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
});
