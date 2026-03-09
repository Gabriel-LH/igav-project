import { SubscriptionModule } from "@/src/components/superadmin/subscription/subscription-module";
import { getTenantsDashboardData } from "@/src/app/(superadmin)/superadmin/actions/tenant.actions";

export default async function SubscriptionPage() {
  const data = await getTenantsDashboardData();
  return (
    <div className="flex flex-col gap-6 p-6">
      <SubscriptionModule
        initialPlans={data.plans}
        initialSubscriptions={data.subscriptions}
        initialTenants={data.tenants}
      />
    </div>
  );
}
