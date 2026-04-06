import { RoleHeader } from "@/src/components/tenant/roles/role-header";
import { RolesLayout } from "@/src/components/tenant/roles/role-layout";
import {
  getRolesAction,
  getSystemPermissionsAction,
} from "@/src/app/(tenant)/tenant/actions/role.actions";
import { requireTenantMembership } from "@/src/infrastructure/tenant/auth.guard";

export default async function RolesPage() {
  const [roles, permissions, authContext] = await Promise.all([
    getRolesAction(),
    getSystemPermissionsAction(),
    requireTenantMembership(),
  ]);

  // Determine if the user has owner/superadmin privileges
  const isSuperAdmin = authContext.user.globalRole === "SUPER_ADMIN";
  const isOwner = 
    isSuperAdmin || 
    authContext.membership?.role?.name === "Owner";
  
  // Filter out system-only permissions for non-superadmins
  const filteredPermissions = isSuperAdmin 
    ? permissions 
    : permissions.filter(p => !["tenants", "permissions"].includes(p.module));
  

  return (
    <div className="flex flex-col gap-6 p-6">
      <RoleHeader />
      <RolesLayout 
        initialRoles={roles} 
        systemPermissions={filteredPermissions} 
        isOwner={isOwner} 
      />
    </div>
  );
}
