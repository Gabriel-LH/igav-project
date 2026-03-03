// components/team/TeamLayout.tsx
"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Users, Shield, Building2, UserCheck, Mail } from "lucide-react";
import { TeamTable, TeamMember } from "././table/team-table";
import { InviteMemberModal } from "./ui/InviteMemberModal";
import { StatsTeams } from "./ui/StatsTeams";

// Mocks
const BRANCHES_MOCK = [
  { id: "branch-1", name: "Sucursal Central" },
  { id: "branch-2", name: "Sucursal Norte" },
  { id: "branch-3", name: "Sucursal Sur" },
];

const TEAM_MEMBERS_MOCK: TeamMember[] = [
  {
    id: "user-1",
    email: "admin@empresa.com",
    name: "Carlos Rodríguez",
    role: "admin",
    branchId: "branch-1",
    branchName: "Sucursal Central",
    status: "active",
    phone: "+51 999 888 777",
    joinedAt: new Date("2023-01-15"),
    lastActive: new Date(),
    permissions: ["all"],
  },
  {
    id: "user-2",
    email: "gerente.norte@empresa.com",
    name: "Ana Martínez",
    role: "manager",
    branchId: "branch-2",
    branchName: "Sucursal Norte",
    status: "active",
    phone: "+51 999 777 666",
    joinedAt: new Date("2023-03-20"),
    lastActive: new Date("2024-12-18"),
    permissions: ["approve_transfers", "view_reports"],
  },
  {
    id: "user-3",
    email: "vendedor1@empresa.com",
    name: "Luis García",
    role: "seller",
    branchId: "branch-1",
    branchName: "Sucursal Central",
    status: "invited",
    joinedAt: new Date("2024-12-19"),
    permissions: [],
  },
  {
    id: "user-4",
    email: "inventario@empresa.com",
    name: "María López",
    role: "inventory",
    branchId: "branch-3",
    branchName: "Sucursal Sur",
    status: "suspended",
    phone: "+51 999 666 555",
    joinedAt: new Date("2023-06-10"),
    permissions: ["bulk_operations"],
  },
  {
    id: "user-5",
    email: "vendedor2@empresa.com",
    name: "Pedro Sánchez",
    role: "seller",
    branchId: "branch-2",
    branchName: "Sucursal Norte",
    status: "active",
    joinedAt: new Date("2024-01-15"),
    lastActive: new Date("2024-12-17"),
    permissions: [],
  },
];

export function TeamLayout() {
  const [members, setMembers] = useState<TeamMember[]>(TEAM_MEMBERS_MOCK);

  const stats = {
    total: members.length,
    active: members.filter((m) => m.status === "active").length,
    invited: members.filter((m) => m.status === "invited").length,
    suspended: members.filter((m) => m.status === "suspended").length,
  };

  const handleInvite = async (data: {
    email: string;
    name: string;
    role: string;
    branchId: string;
    permissions: string[];
    message?: string;
  }) => {
    // Simular API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const newMember: TeamMember = {
      id: `user-${Date.now()}`,
      email: data.email,
      name: data.name || data.email.split("@")[0],
      role: data.role as TeamMember["role"],
      branchId: data.branchId,
      branchName:
        BRANCHES_MOCK.find((b) => b.id === data.branchId)?.name ||
        data.branchId,
      status: "invited",
      joinedAt: new Date(),
      permissions: data.permissions,
    };

    setMembers((prev) => [...prev, newMember]);
    console.log("Invitación enviada:", data);
  };

  const handleEdit = (member: TeamMember) => {
    console.log("Editar:", member);
  };

  const handleSuspend = (id: string) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, status: "suspended" as const } : m,
      ),
    );
  };

  const handleActivate = (id: string) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: "active" as const } : m)),
    );
  };

  const handleDelete = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const handleChangeRole = (id: string, role: TeamMember["role"]) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role } : m)));
  };

  const handleResendInvite = (id: string) => {
    console.log("Reenviar invitación:", id);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Stats */}
      <StatsTeams stats={stats} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4">
        <InviteMemberModal branches={BRANCHES_MOCK} onInvite={handleInvite} />
      </div>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Miembros del equipo
          </CardTitle>
          <CardDescription>
            Administra roles, permisos y estados de tu equipo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TeamTable
            data={members}
            branches={BRANCHES_MOCK}
            onEdit={handleEdit}
            onSuspend={handleSuspend}
            onActivate={handleActivate}
            onDelete={handleDelete}
            onChangeRole={handleChangeRole}
            onResendInvite={handleResendInvite}
          />
        </CardContent>
      </Card>
    </div>
  );
}
