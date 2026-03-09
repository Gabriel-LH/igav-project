import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "./lib/auth";

export async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/superadmin/auth/login")) {
    if (session?.user.globalRole === "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/superadmin/dashboard", request.url));
    }
    if (session) {
      return NextResponse.redirect(new URL("/tenant/home", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/auth/login")) {
    if (session?.user.globalRole === "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/superadmin/dashboard", request.url));
    }
    if (session) {
      return NextResponse.redirect(new URL("/tenant/home", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/superadmin")) {
    if (!session) {
      return NextResponse.redirect(
        new URL("/superadmin/auth/login", request.url),
      );
    }

    if (session.user.globalRole !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/tenant/home", request.url));
    }
  }

  if (pathname.startsWith("/tenant")) {
    if (!session) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    if (session.user.globalRole === "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/superadmin/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/superadmin/:path*", "/tenant/:path*", "/auth/:path*"],
};
