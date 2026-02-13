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
        const creds = credentials as
          | { email?: string; password?: string }
          | undefined;
        if (!creds?.email || !creds?.password) {
          return null;
        }

        try {
          // Call C# backend API for authentication
          const apiUrl =
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:5117";
          const response = await fetch(`${apiUrl}/api/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: creds.email,
              password: creds.password,
            }),
          });

          if (!response.ok) {
            console.error("Authentication failed:", response.status);
            return null;
          }

          const data = await response.json();

          // API returns { token, user: { id, email, name } }
          if (data.token && data.user) {
            return {
              id: data.user.id,
              email: data.user.email,
              name: data.user.name,
              // Store the JWT token in the user object so it can be added to the token
              token: data.token,
            } as User & { token: string };
          }

          return null;
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/admin/login",
  },
  trustHost: true, // Required for NextAuth v5 and localhost development
  session: {
    strategy: "jwt",
  },
  // Development-friendly cookie settings for localhost
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.session-token"
          : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production", // Only secure in production
      },
    },
  },
  callbacks: {
    async jwt({
      token,
      user,
    }: {
      token: JWT;
      user?: User | null;
    }): Promise<JWT> {
      console.log("JWT callback called", { hasUser: !!user, token: token });
      if (user) {
        console.log("JWT callback: storing user  in token", {
          userId: user.id,
          email: user.email,
        });
        const t = token as JWT & {
          id?: string;
          email?: string | undefined;
          accessToken?: string;
        };
        t.id = user.id;
        t.email = (user.email ?? undefined) as string | undefined;
        // Store the JWT token from the backend API
        t.accessToken = (user as User & { token?: string }).token;
        console.log("JWT callback: accessToken stored", {
          hasToken: !!t.accessToken,
        });
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
      console.log("Session callback called", {
        token: token,
        session: session,
      });
      if (token && session.user) {
        const te = token as JWT & {
          id?: string | null;
          email?: string | null;
          accessToken?: string;
        };
        const u = session.user as Session["user"] & {
          id?: string;
          email?: string | undefined;
        };
        const s = session as Session & { accessToken?: string };
        u.id = (te.id ?? undefined) as string;
        u.email = (te.email ?? undefined) as string | undefined;
        // Make the backend JWT token available in the session
        s.accessToken = te.accessToken;
        session.user = u;
        console.log("Session callback: user set", {
          userId: u.id,
          email: u.email,
        });
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});
