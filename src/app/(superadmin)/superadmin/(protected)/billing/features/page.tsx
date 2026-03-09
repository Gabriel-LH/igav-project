import { FeaturesModule } from "@/src/components/superadmin/features/features-module";
import { getTenantsDashboardData } from "@/src/app/(superadmin)/superadmin/actions/tenant.actions";

export default async function FeaturesPage() {
  const data = await getTenantsDashboardData();
  return (
    <div className="flex flex-col gap-6 p-6">
      <FeaturesModule initialPlans={data.plans} />
    </div>
  );
}
