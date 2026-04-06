// app/(admin)/layout.tsx
import { AppSidebar } from "@/src/components/tenant/side-bar/app-sidebar";
import { SiteHeader } from "@/src/components/tenant/header/site-header";
import { SidebarInset, SidebarProvider } from "@/components/sidebar";
import { requireTenantMembership } from "@/src/infrastructure/tenant/auth.guard";
import { redirect } from "next/navigation";
import { getActivePlanFeaturesAction } from "@/src/app/(tenant)/tenant/actions/plan.actions";
import { PlanFeaturesProvider } from "@/src/components/tenant/plan-features-provider";
import { getBranchesAction } from "./actions/branch.actions";
import { SessionHydrator } from "@/src/components/auth/SessionHydrator";
import { PromotionHydrator } from "@/src/components/tenant/promotion/PromotionHydrator";
import { getPromotionsAction } from "./actions/promotion.actions";
import { getTenantUsersAction } from "./actions/user.actions";
import { UserHydrator } from "@/src/components/auth/UserHydrator";
import { BranchHydrator } from "@/src/components/tenant/branch/BranchHydrator";
import { getCategoriesAction } from "./actions/category.actions";
import { CategoryHydrator } from "@/src/components/tenant/category/CategoryHydrator";
import { getCashSessionsAction } from "./actions/cash-session.actions";
import { CashSessionHydrator } from "@/src/components/tenant/cash/CashSessionHydrator";
import { getTenantConfigAction } from "./actions/settings.actions";
import { TenantConfigHydrator } from "@/src/components/tenant/settings/TenantConfigHydrator";

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

  // Parallel fetching
  const [planFeatures, branchesRes, promotionsRes, usersRes, categoriesRes, cashSessionsRes, tenantConfigRes] = await Promise.all([
    getActivePlanFeaturesAction(),
    getBranchesAction(),
    getPromotionsAction(),
    getTenantUsersAction(),
    getCategoriesAction(),
    getCashSessionsAction(),
    getTenantConfigAction(),
  ]);

  const branches = branchesRes.success ? branchesRes.data : [];
  const promotions = promotionsRes.success ? promotionsRes.data : [];
  const users = usersRes.success ? usersRes.data : [];
  const categories = categoriesRes.success ? categoriesRes.data : [];
  const cashSessions = cashSessionsRes.success ? cashSessionsRes.data : [];
  const tenantConfig = tenantConfigRes.success ? tenantConfigRes.data : null;
  const tenant = access.membership.tenant;
  
  const logoUrl =
    tenant?.metadata && typeof (tenant.metadata as any).logoUrl === "string"
      ? ((tenant.metadata as any).logoUrl as string)
      : "";

  return (
    <PlanFeaturesProvider initialData={planFeatures}>
      <SessionHydrator
        data={{
          user: {
            id: access.user.id,
            email: access.user.email,
            name: access.user.name ?? "",
          },
          membership: {
            tenantId: access.tenantId!,
            role: access.membership.role as any,
            branch: access.membership.branch as any,
          },
        }}
      />
      <PromotionHydrator data={promotions as any} />
      <UserHydrator data={users as any} />
      <BranchHydrator data={branches as any} />
      <CategoryHydrator data={categories as any} />
      <CashSessionHydrator data={cashSessions as any} />
      {tenantConfig && <TenantConfigHydrator data={tenantConfig as any} />}
      
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar
          variant="inset"
          branches={branches as any}
          tenant={tenant as any}
          user={access.user as any}
          membershipRoleName={access.membership.role?.name}
          logoUrl={logoUrl}
        />

        <SidebarInset>
          <header className="sticky top-0 z-10 w-full border-b rounded-t-lg bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
            <SiteHeader tenantName={tenant.name} logoUrl={logoUrl} />
          </header>

          <div className="flex flex-1 flex-col min-w-0 w-full">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </PlanFeaturesProvider>
  );
}
