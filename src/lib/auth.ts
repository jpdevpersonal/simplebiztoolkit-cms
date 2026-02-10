/**
 * NextAuth Configuration
 * Handles authentication for the Admin Portal
 */

import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { User } from "next-auth";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(
        credentials: Record<string, any> | undefined,
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
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});
