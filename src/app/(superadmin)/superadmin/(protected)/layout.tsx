import { SuperAdminAppSidebar } from "@/src/components/superadmin/side-bar/superadmin-app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/sidebar";
import { SuperAdminSiteHeader } from "@/src/components/superadmin/header/superadmin-site-header";
import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.globalRole !== "SUPER_ADMIN") {
    redirect("/auth/login");
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <SuperAdminAppSidebar variant="inset" />

      <SidebarInset>
        <header className="sticky top-0 z-10 w-full border-b rounded-t-lg bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
          <SuperAdminSiteHeader />
        </header>

        {/* Contenido dinámico */}
        <div className="flex flex-1 flex-col ">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
