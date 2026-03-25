import { TenantConfigModule } from "./tenant-config-module";
import { getTenantProfileAction } from "@/src/app/(tenant)/tenant/actions/tenant-profile.actions";

export async function SettingsLayout() {
  const tenantProfile = await getTenantProfileAction();
  return (
    <div className="space-y-6">
      <TenantConfigModule tenantProfile={tenantProfile} />
    </div>
  );
}
