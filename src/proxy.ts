import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const cookies = request.cookies;

  // 1. Detección robusta de sesión (incluyendo tokens de Better Auth)
  const hasSessionCookie =
    cookies.has("better-auth.session_token") ||
    cookies.has("__Secure-better-auth.session_token") ||
    cookies.has("better-auth.session_data") ||
    cookies.has("__Secure-better-auth.session_data");

  // 2. Identificar si es un prefetch de Next.js
  const isPrefetch =
    request.headers.get("purpose") === "prefetch" ||
    request.headers.get("x-middleware-prefetch") === "1" ||
    request.headers.get("x-nextjs-data") === "1";

  // 3. Lógica para rutas de AUTH (Login, Registro, etc.)
  if (
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/superadmin/auth/")
  ) {
    // SI YA TIENE SESIÓN: Solo mándalo a home si NO hay un error en la URL.
    // Si hay un error (ej. ?error=no_membership), déjalo en la página de login para que vea el mensaje.
    if (hasSessionCookie && !request.nextUrl.searchParams.has("error")) {
      const homeUrl = pathname.startsWith("/superadmin")
        ? "/superadmin"
        : "/tenant/home";
      return NextResponse.redirect(new URL(homeUrl, request.url));
    }

    // SI NO TIENE SESIÓN: Déjalo pasar a la página de login.
    return NextResponse.next();
  }

  // 4. Protección de rutas de TENANT
  if (pathname.startsWith("/tenant")) {
    if (!hasSessionCookie) {
      // Si es un prefetch, NO redirijas.
      // Los prefetches no deben causar redirecciones 307 de este tipo.
      if (isPrefetch) {
        return new NextResponse(null, { status: 204 }); // "No Content" es mejor que 307 aquí
      }

      const destination = new URL("/auth/login", request.url);
      destination.searchParams.set("redirect", pathname + search);
      return NextResponse.redirect(destination);
    }
  }

  // 5. Protección de rutas de SUPERADMIN
  if (pathname.startsWith("/superadmin")) {
    if (!hasSessionCookie) {
      if (isPrefetch) return NextResponse.next();

      return NextResponse.redirect(
        new URL("/superadmin/auth/login", request.url),
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  // Ajustamos el matcher para que sea más específico y no atrape estáticos innecesarios
  matcher: ["/superadmin/:path*", "/tenant/:path*", "/auth/:path*"],
};
