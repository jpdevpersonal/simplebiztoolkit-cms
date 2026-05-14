/**
 * Middleware for protecting routes
 * Redirects unauthenticated users from CMS routes
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import {
  CMS_LOGIN_PATH,
  isCmsPath,
  isLegacyAdminPath,
  toCmsPath,
  toLegacyAdminPath,
} from "@/lib/adminRoutes";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isLegacyAdminPath(pathname)) {
    const cmsUrl = request.nextUrl.clone();
    cmsUrl.pathname = toCmsPath(pathname);
    return NextResponse.redirect(cmsUrl);
  }

  if (isCmsPath(pathname)) {
    const isLoginRoute =
      pathname === CMS_LOGIN_PATH || pathname.startsWith(`${CMS_LOGIN_PATH}/`);

    if (!isLoginRoute) {
      const session = await auth();

      if (!session) {
        const loginUrl = new URL(CMS_LOGIN_PATH, request.url);
        loginUrl.searchParams.set(
          "callbackUrl",
          `${pathname}${request.nextUrl.search}`,
        );
        return NextResponse.redirect(loginUrl);
      }
    }

    const legacyUrl = request.nextUrl.clone();
    legacyUrl.pathname = toLegacyAdminPath(pathname);
    return NextResponse.rewrite(legacyUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/cms/:path*"],
};
