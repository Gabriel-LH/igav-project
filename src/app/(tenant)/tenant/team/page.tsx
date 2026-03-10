import { TeamHeader } from "@/src/components/tenant/team/team-header";
import { TeamLayout } from "@/src/components/tenant/team/team-layout";
import {
  getTenantMembersAction,
  getTenantInvitationsAction,
} from "@/src/app/(tenant)/tenant/actions/invitation.actions";
import { requireTenantMembership } from "@/src/infrastructure/tenant/auth.guard";
import prisma from "@/src/lib/prisma";

export default async function TeamPage() {
  const membership = await requireTenantMembership();
  const tenantId = membership.tenantId;

  if (!tenantId) {
    throw new Error("El ID del tenant es obligatorio para ver el equipo.");
  }

  // Fetch in parallel
  const [members, invitations, branches, roles] = await Promise.all([
    getTenantMembersAction() as Promise<any[]>,
    getTenantInvitationsAction() as Promise<any[]>,
    prisma.branch.findMany({
      where: { tenantId, status: "active" },
      select: { id: true, name: true },
      orderBy: { isPrimary: "desc" },
    }),
    prisma.role.findMany({
      where: {
        tenantId,
        NOT: { name: "owner" }, // owner cannot be assigned via invitation
      },
      select: { id: true, name: true, description: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <TeamHeader />
      <TeamLayout
        initialMembers={members}
        initialInvitations={invitations}
        branches={branches}
        roles={roles}
      />
    </div>
  );
}
