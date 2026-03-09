// app/(admin)/layout.tsx
import { AppSidebar } from "@/src/components/tenant/side-bar/app-sidebar";
import { SiteHeader } from "@/src/components/tenant/header/site-header";
import { SidebarInset, SidebarProvider } from "@/components/sidebar";
import { requireTenantMembership } from "@/src/infrastructure/tenant/auth.guard";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/src/lib/auth";
import { getActivePlanFeaturesAction } from "@/src/app/(tenant)/tenant/actions/plan.actions";
import { PlanFeaturesProvider } from "@/src/components/tenant/plan-features-provider";

export default async function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const access = await requireTenantMembership().catch(() => null);
  if (!access) {
    redirect("/auth/login");
  }
  if (access.user.globalRole === "SUPER_ADMIN") {
    redirect("/superadmin/dashboard");
  }
  if (!access.membership) {
    redirect("/auth/login?error=no_tenant_membership");
  }

  const planFeatures = await getActivePlanFeaturesAction();

  return (
    <PlanFeaturesProvider initialData={planFeatures}>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" user={access.user as any} />

        <SidebarInset>
          <header className="sticky top-0 z-10 w-full border-b rounded-t-lg bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
            <SiteHeader />
          </header>

          {/* Contenido dinámico */}
          <div className="flex flex-1 flex-col ">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </PlanFeaturesProvider>
  );
}
