// components/team/TeamLayout.tsx
"use client";

import { useState, useMemo } from "react";

import { TeamTable, TeamMember } from "./table/team-table";
import { InviteMemberModal } from "./ui/InviteMemberModal";
import { EditMemberModal } from "./ui/EditMemberModal";
import { StatsTeams } from "./ui/StatsTeams";
import { revokeInvitationAction } from "@/src/app/(tenant)/tenant/actions/invitation.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Types matching what Prisma returns from getTenantMembersAction
type DBMember = {
  id: string;
  userId: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    dni: string | null;
    image: string | null;
    status: string;
  };
  role: { id: string; name: string };
  branch: { id: string; name: string };
};

type DBInvitation = {
  id: string;
  email: string;
  status: string;
  createdAt: Date;
  expiresAt: Date;
  role: { id: string; name: string };
  branch: { id: string; name: string };
  invitedBy: { id: string; name: string; email: string };
};

interface TeamLayoutProps {
  initialMembers: DBMember[];
  initialInvitations: DBInvitation[];
  branches: Array<{ id: string; name: string }>;
  roles: Array<{ id: string; name: string; description: string | null }>;
}

function mapMemberToTableRow(m: DBMember): TeamMember {
  const roleNameLower = m.role.name.toLowerCase() as TeamMember["role"];
  const validRoles: TeamMember["role"][] = [
    "owner",
    "admin",
    "manager",
    "seller",
    "inventory",
    "viewer",
  ];
  const role = validRoles.includes(roleNameLower) ? roleNameLower : "viewer";

  return {
    id: m.id,
    userId: m.user.id,
    email: m.user.email,
    name: m.user.name,
    dni: m.user.dni ?? undefined,
    avatar: m.user.image ?? undefined,
    role,
    branchId: m.branch.id,
    branchName: m.branch.name,
    status: (m.status as TeamMember["status"]) ?? "active",
    joinedAt: new Date(m.createdAt),
    permissions: [],
  };
}

function mapInvitationToTableRow(inv: DBInvitation): TeamMember {
  return {
    id: `inv-${inv.id}`,
    email: inv.email,
    name: inv.email.split("@")[0],
    role: "viewer",
    branchId: inv.branch.id,
    branchName: inv.branch.name,
    status: "invited",
    joinedAt: new Date(inv.createdAt),
    permissions: [],
    _invitationId: inv.id,
  } as TeamMember & { _invitationId: string };
}

export function TeamLayout({
  initialMembers,
  initialInvitations,
  branches,
  roles,
}: TeamLayoutProps) {
  const router = useRouter();
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  // Merge members + pending invitations into a single list
  const members = useMemo<TeamMember[]>(() => {
    return [
      ...initialMembers.map(mapMemberToTableRow),
      ...initialInvitations
        .filter((inv) => inv.status === "pending")
        .map(mapInvitationToTableRow),
    ];
  }, [initialMembers, initialInvitations]);

  const stats = useMemo(() => ({
    total: members.length,
    active: members.filter((m) => m.status === "active").length,
    invited: members.filter((m) => m.status === "invited").length,
    suspended: members.filter((m) => m.status === "suspended").length,
  }), [members]);

  const handleEdit = (member: TeamMember) => {
    if (member.status === "invited") {
      toast.info("Completa primero la invitación para poder editar al miembro.");
      return;
    }
    setEditingMember(member);
  };

  const handleSuspend = (_id: string) => {
    toast.info("Función de suspender en desarrollo");
  };

  const handleActivate = (_id: string) => {
    toast.info("Función de activar en desarrollo");
  };

  const handleDelete = (_id: string) => {
    toast.info("Función de eliminar en desarrollo");
  };

  const handleChangeRole = (_id: string, _role: TeamMember["role"]) => {
    toast.info("Función de cambio de rol en desarrollo");
  };

  const handleResendInvite = (_id: string) => {
    toast.info("Por ahora re-genera una nueva invitación desde el modal.");
  };

  const handleRevokeInvite = (invitationId: string) => {
    (async () => {
      try {
        await revokeInvitationAction(invitationId);
        toast.success("Invitación revocada.");
        router.refresh();
      } catch {
        toast.error("No se pudo revocar la invitación.");
      }
    })();
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <StatsTeams stats={stats} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4">
        <InviteMemberModal branches={branches} roles={roles} />
      </div>

      {/* Tabla */}

      <div>
        <TeamTable
          data={members}
          branches={branches}
          onEdit={handleEdit}
          onSuspend={handleSuspend}
          onActivate={handleActivate}
          onDelete={handleDelete}
          onChangeRole={handleChangeRole}
          onResendInvite={handleResendInvite}
          onRevokeInvite={handleRevokeInvite}
        />
      </div>

      <EditMemberModal
        key={editingMember?.id ?? "empty"}
        member={editingMember}
        open={!!editingMember}
        onOpenChange={(open) => {
          if (!open) setEditingMember(null);
        }}
      />
    </div>
  );
}
