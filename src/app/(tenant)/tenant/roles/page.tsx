import { RoleHeader } from "@/src/components/tenant/roles/role-header";
import { RolesLayout } from "@/src/components/tenant/roles/role-layout";

export default function RolesPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <RoleHeader />
      <RolesLayout />
    </div>
  );
}
