import { DashboardLayout } from "@/src/components/superadmin/dashboard/dashboard-layout";
import { getTenantsDashboardData } from "@/src/app/(superadmin)/superadmin/actions/tenant.actions";

export default async function DashboardPage() {
  const data = await getTenantsDashboardData();
  return (
    <div className="flex flex-col gap-6 p-6">
      <DashboardLayout
        initialPlans={data.plans}
        initialSubscriptions={data.subscriptions}
        initialTenants={data.tenants}
      />
    </div>
  );
}
