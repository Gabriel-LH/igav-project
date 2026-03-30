import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function proxy(request: NextRequest) {
  const sessionToken = getSessionCookie(request.headers);
  const hasSession = Boolean(sessionToken);

  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/superadmin/auth/login")) {
    if (hasSession) {
      return NextResponse.redirect(new URL("/tenant/home", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/auth/login")) {
    if (hasSession) {
      return NextResponse.redirect(new URL("/tenant/home", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/auth/new-account") || pathname.startsWith("/auth/verify-email")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/superadmin")) {
    if (!hasSession) {
      return NextResponse.redirect(
        new URL("/superadmin/auth/login", request.url),
      );
    }
  }

  if (pathname.startsWith("/tenant")) {
    if (!hasSession) {
      // Avoid redirect loops on prefetch or during cookie propagation.
      if (request.headers.get("purpose") === "prefetch") {
        return NextResponse.next();
      }
      const from = request.nextUrl.clone();
      return NextResponse.redirect(
        new URL(`/auth/login?redirect=${encodeURIComponent(from.pathname + from.search)}`, request.url),
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/superadmin/:path*", "/tenant/:path*", "/auth/:path*"],
};
