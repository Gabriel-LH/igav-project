import { TenantHeader } from "@/src/components/superadmin/tenants/tenant-header";
import { TenantLayout } from "@/src/components/superadmin/tenants/tenant-layout";

export default function TenantsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <TenantHeader />
      <TenantLayout />
    </div>
  );
}
