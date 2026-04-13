import { auth } from "@/src/lib/auth";
import { Navbar } from "@/src/components/landing/navbar";
import { Toaster } from "sonner";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import prisma from "@/src/lib/prisma";

export default async function TenantAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });
  const cookieHeader = requestHeaders.get("cookie") ?? "";
  const hasBetterAuthCookie =
    cookieHeader.includes("better-auth.session_token=") ||
    cookieHeader.includes("__Secure-better-auth.session_token=") ||
    cookieHeader.includes("better-auth.session_data=") ||
    cookieHeader.includes("__Secure-better-auth.session_data=");

  if (!session && hasBetterAuthCookie) {
    redirect("/auth/clear-stale-session?returnTo=/auth/login");
  }

  if (session?.user) {
    if (session.user.globalRole === "SUPER_ADMIN") {
      return redirect("/superadmin/dashboard");
    }
    // Tenant users with memberships will be redirected by the Middleware (proxy.ts)
    // ONLY if there is no 'error' parameter. This breaks the 200-level loop.
  }

  return (
    <>
      <div className="absolute w-full ">
        <Navbar />
      </div>
      <main className="min-h-screen sticky z-0 top-0  bg-cover bg-center bg-no-repeat flex items-center justify-center">
        <div className="w-full">
          {children}
          <Toaster
            position="top-left"
            toastOptions={{
              style: {
                color: "white",
                backdropFilter: "blur(20px)",
                border: "none",
              },
            }}
          />
        </div>
      </main>
    </>
  );
}
