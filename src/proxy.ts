import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "./lib/auth";

export async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/superadmin")) {
    // permitir entrar al login del superadmin
    if (pathname.startsWith("/superadmin/auth/login")) {
      return NextResponse.next();
    }

    if (!session) {
      return NextResponse.redirect(
        new URL("/superadmin/auth/login", request.url),
      );
    }

    if (session.user.globalRole !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/superadmin/:path*"],
};
