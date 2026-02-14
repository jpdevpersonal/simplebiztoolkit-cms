"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

export default function AuthProvider({ children }: { children: ReactNode }) {
  return <SessionProvider refetchInterval={0}>{children}</SessionProvider>;
}
