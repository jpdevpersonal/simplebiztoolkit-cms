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
      async authorize(credentials: unknown): Promise<User | null> {
        // TODO: Replace this with actual API call to C# backend
        // This is a temporary implementation for development

        const creds = credentials as
          | { email?: string; password?: string }
          | undefined;
        if (!creds?.email || !creds?.password) {
          return null;
        }

        // In production, verify against C# API:
        // const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        //   method: 'POST',
        //   body: JSON.stringify({ email: credentials.email, password: credentials.password }),
        // });

        // Temporary hardcoded check (REMOVE IN PRODUCTION)
        if (
          creds.email === process.env.ADMIN_EMAIL &&
          creds.password === process.env.ADMIN_PASSWORD_HASH
        ) {
          return {
            id: "1",
            email: creds.email as string,
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
        const t = token as JWT & { id?: string; email?: string | undefined };
        t.id = user.id;
        t.email = (user.email ?? undefined) as string | undefined;
      }
      return token;
    },
    async session({
      session,
      token,
    }: {
      session: Session;
      token: JWT;
    }): Promise<Session> {
      if (token && session.user) {
        const te = token as JWT & { id?: string | null; email?: string | null };
        const u = session.user as Session["user"] & {
          id?: string;
          email?: string | undefined;
        };
        u.id = (te.id ?? undefined) as string;
        u.email = (te.email ?? undefined) as string | undefined;
        session.user = u;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});
