import { PlansModule } from "@/src/components/superadmin/plans/plans-module";
import { getTenantsDashboardData } from "@/src/app/(superadmin)/superadmin/actions/tenant.actions";

export default async function PlansPage() {
  const data = await getTenantsDashboardData();

  return (
    <div className="flex flex-col gap-6 p-6">
      <PlansModule
        initialPlans={data.plans}
        initialSubscriptions={data.subscriptions}
        initialTenants={data.tenants}
      />
    </div>
  );
}
