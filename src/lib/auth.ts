/**
 * NextAuth Configuration
 * Handles authentication for the Admin Portal
 */

import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { User, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(
        credentials?: { email?: string; password?: string } | undefined,
      ): Promise<User | null> {
        // TODO: Replace this with actual API call to C# backend
        // This is a temporary implementation for development

        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // In production, verify against C# API:
        // const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        //   method: 'POST',
        //   body: JSON.stringify({ email: credentials.email, password: credentials.password }),
        // });

        // Temporary hardcoded check (REMOVE IN PRODUCTION)
        if (
          credentials.email === process.env.ADMIN_EMAIL &&
          credentials.password === process.env.ADMIN_PASSWORD_HASH
        ) {
          return {
            id: "1",
            email: credentials.email as string,
            name: "Admin User",
          };
        }

        return null;
      },
    }),
  ],
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    async jwt({
      token,
      user,
    }: {
      token: JWT;
      user?: User | null;
    }): Promise<JWT> {
      if (user) {
        const t = token as JWT & { id?: string; email?: string };
        t.id = user.id;
        t.email = user.email;
      }
      return token;
    },
    async session({
      session,
      token,
    }: {
      session: Session;
      token: JWT & { id?: string; email?: string };
    }): Promise<Session> {
      if (token && session.user) {
        const u = session.user as Session["user"] & {
          id?: string;
          email?: string;
        };
        u.id = token.id as string;
        u.email = token.email as string;
        session.user = u;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});
