import { NextRequest, NextResponse } from "next/server";

const BETTER_AUTH_COOKIE_PREFIXES = [
  "better-auth.",
  "__Secure-better-auth.",
];

export async function GET(request: NextRequest) {
  const returnTo = request.nextUrl.searchParams.get("returnTo") || "/auth/login";
  const response = NextResponse.redirect(new URL(returnTo, request.url));

  for (const cookie of request.cookies.getAll()) {
    if (
      BETTER_AUTH_COOKIE_PREFIXES.some((prefix) => cookie.name.startsWith(prefix))
    ) {
      response.cookies.set({
        name: cookie.name,
        value: "",
        maxAge: 0,
        path: "/",
      });
    }
  }

  return response;
}
