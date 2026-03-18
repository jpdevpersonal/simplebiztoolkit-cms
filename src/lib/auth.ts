/**
 * NextAuth Configuration
 * Handles authentication for the Admin Portal
 */

import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { User, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import {
  parseHttpResponse,
  sendHttpRequest,
  unwrapDataEnvelope,
} from "@/lib/httpTransport";
import { getApiBaseUrlForServer } from "@/config/apiBaseUrl";

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

        let loginUrl = "";

        try {
          const apiUrl = getApiBaseUrlForServer();
          loginUrl = `${apiUrl}/api/auth/login`;

          const response = await sendHttpRequest(loginUrl, {
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
            const { payload } = await parseHttpResponse(response);

            console.error("Authentication failed", {
              loginUrl,
              status: response.status,
              payload,
            });

            return null;
          }

          const { payload } = await parseHttpResponse(response);
          const data = unwrapDataEnvelope<{
            token?: string;
            expiresAtUtc?: string;
            user?: User;
          }>(payload);

          // API returns { token, expiresAtUtc, user: { id, email, name } }
          if (data.token && data.user) {
            return {
              id: data.user.id,
              email: data.user.email,
              name: data.user.name,
              token: data.token,
              expiresAtUtc: data.expiresAtUtc,
            } as User & { token: string; expiresAtUtc?: string };
          }

          return null;
        } catch (error) {
          console.error("Authentication error", {
            loginUrl,
            error,
          });

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
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
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
      if (user) {
        const t = token as JWT & {
          id?: string;
          email?: string | undefined;
          accessToken?: string;
          expiresAtUtc?: string;
        };
        t.id = user.id;
        t.email = (user.email ?? undefined) as string | undefined;
        t.accessToken = (user as User & { token?: string }).token;
        t.expiresAtUtc = (
          user as User & { expiresAtUtc?: string }
        ).expiresAtUtc;
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
        const te = token as JWT & {
          id?: string | null;
          email?: string | null;
          accessToken?: string;
          expiresAtUtc?: string;
        };
        const u = session.user as Session["user"] & {
          id?: string;
          email?: string | undefined;
        };
        const s = session as Session & {
          accessToken?: string;
          expiresAtUtc?: string;
        };
        u.id = (te.id ?? undefined) as string;
        u.email = (te.email ?? undefined) as string | undefined;
        s.accessToken = te.accessToken;
        s.expiresAtUtc = te.expiresAtUtc;
        session.user = u;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});
