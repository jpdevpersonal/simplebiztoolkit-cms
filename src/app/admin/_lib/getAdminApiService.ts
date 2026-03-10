import { headers } from "next/headers";
import type { Session } from "next-auth";
import { apiService, getApiService } from "@/lib/api";
import { auth } from "@/lib/auth";

export async function getAdminApiService(): Promise<{
  service: typeof apiService;
  session: Session | null;
}> {
  // Calling headers() forces dynamic rendering and ensures auth/cookies are read.
  await headers();

  const session = (await auth()) as Session | null;
  const extended = session as
    | (Session & { accessToken?: string; expiresAtUtc?: string })
    | null;
  const isExpired = extended?.expiresAtUtc
    ? Date.parse(extended.expiresAtUtc) <= Date.now()
    : false;
  const accessToken = isExpired ? undefined : extended?.accessToken;

  const service = accessToken ? getApiService(accessToken) : apiService;
  return { service, session };
}
