import { RoleHeader } from "@/src/components/tenant/roles/role-header";
import { RolesLayout } from "@/src/components/tenant/roles/role-layout";
import {
  getRolesAction,
  getSystemPermissionsAction,
} from "@/src/app/(tenant)/tenant/actions/role.actions";

export default async function RolesPage() {
  const [roles, permissions] = await Promise.all([
    getRolesAction(),
    getSystemPermissionsAction(),
  ]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <RoleHeader />
      <RolesLayout initialRoles={roles} systemPermissions={permissions} />
    </div>
  );
}
