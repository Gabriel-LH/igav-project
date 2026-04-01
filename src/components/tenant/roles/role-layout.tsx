// components/roles/RolesLayout.tsx
"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Users, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { RolesTable, Role } from "./table/roles-table";
import { RoleForm } from "./role-form";
import { RoleDetail } from "./role-details";
import {
  createRoleAction,
  updateRolePermissionsAction,
  deleteRoleAction,
} from "@/src/app/(tenant)/tenant/actions/role.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { RoleDTO } from "@/src/domain/tenant/repositories/RoleRepository";

type SystemPermission = {
  id: string;
  key: string;
  module: string;
  description: string | null;
};

interface RolesLayoutProps {
  initialRoles: RoleDTO[];
  systemPermissions: SystemPermission[];
}

function mapToTableRole(dto: RoleDTO): Role {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description ?? undefined,
    isSystem: dto.isSystem,
    isActive: true, // all roles from DB are active
    userCount: dto._count?.userTenantMemberships ?? 0,
    permissionIds: dto.permissions.map((p) => p.key),
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export function RolesLayout({
  initialRoles,
  systemPermissions,
}: RolesLayoutProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [roles, setRoles] = useState<Role[]>(initialRoles.map(mapToTableRole));



  // isOwner would come from session, for now assume true (layout-level protection should handle it)
  const isOwner = true;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [detailRole, setDetailRole] = useState<Role | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const stats = {
    total: roles.length,
    system: roles.filter((r) => r.isSystem).length,
    custom: roles.filter((r) => !r.isSystem).length,
    active: roles.length, // all stored roles are active
  };

  const handleCreate = async (data: {
    name: string;
    description: string;
    isSystem: boolean;
    permissionIds: string[];
    isActive: boolean;
  }) => {
    if (editingRole) {
      // Update permissions
      startTransition(async () => {
        try {
          await updateRolePermissionsAction(editingRole.id, data.permissionIds);
          toast.success("Rol actualizado");
          router.refresh();
        } catch (err) {
          toast.error(
            err instanceof Error ? err.message : "Error al actualizar el rol",
          );
        }
      });
    } else {
      // Create new custom role
      startTransition(async () => {
        try {
          await createRoleAction({
            name: data.name,
            description: data.description,
            permissionKeys: data.permissionIds,
          });
          toast.success("Rol creado");
          router.refresh();
        } catch (err) {
          toast.error(
            err instanceof Error ? err.message : "Error al crear el rol",
          );
        }
      });
    }
    setIsFormOpen(false);
    setEditingRole(null);
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setIsFormOpen(true);
    setIsDetailOpen(false);
  };

  const handleClone = (role: Role) => {
    setEditingRole({
      ...role,
      id: "",
      name: `${role.name} (Copia)`,
      isSystem: false,
    });
    setIsFormOpen(true);
    setIsDetailOpen(false);
  };

  const handleDelete = (id: string) => {
    const role = roles.find((r) => r.id === id);
    if (!role) return;
    startTransition(async () => {
      try {
        await deleteRoleAction(id);
        toast.success("Rol eliminado");
        router.refresh();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Error al eliminar el rol",
        );
      }
    });
    setIsDetailOpen(false);
  };

  const handleToggleActive = (id: string, active: boolean) => {
    // TODO: wire to a toggleRoleActive action
    toast.info("Función de activar/desactivar rol en desarrollo");
  };

  const handleViewDetail = (role: Role) => {
    setDetailRole(role);
    setIsDetailOpen(true);
  };

  if (roles.length === 0) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="col-span-full py-10 flex flex-col items-center justify-center text-muted-foreground">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-b-violet-600 border-t-violet-300 mx-auto mb-4"></div>
              <p className="text-sm animate-pulse font-semibold">
                Cargando módulo de sucursales...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total roles</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Lock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.system}</p>
              <p className="text-xs text-muted-foreground">Del sistema</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-xs text-muted-foreground">Activos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Users className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {roles.reduce((acc, r) => acc + r.userCount, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Usuarios totales</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info banner */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3 dark:bg-blue-950/30 dark:border-blue-800">
        <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800 dark:text-blue-300">
          <p className="font-medium mb-1">Roles pre-configurados del sistema</p>
          <p>
            Tu tenant incluye: <strong>owner</strong>, <strong>admin</strong>,{" "}
            <strong>vendedor</strong> y <strong>cajero</strong>. Los roles del
            sistema no se pueden eliminar. Puedes crear roles personalizados
            adicionales.
          </p>
        </div>
      </div>

      {/* Tabla */}

      <div>
        <RolesTable
          data={roles}
          isOwner={isOwner}
          onEdit={handleEdit}
          onClone={handleClone}
          onDelete={handleDelete}
          onViewDetail={handleViewDetail}
          onToggleActive={handleToggleActive}
          setEditingRole={setEditingRole}
          setIsFormOpen={setIsFormOpen}
          isPending={isPending}
        />
      </div>

      {/* Modal de creación/edición */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? "Editar permisos del Rol" : "Crear Nuevo Rol"}
            </DialogTitle>
          </DialogHeader>
          <RoleForm
            initialData={
              editingRole
                ? {
                    name: editingRole.name,
                    description: editingRole.description ?? "",
                    isSystem: editingRole.isSystem,
                    permissionIds: editingRole.permissionIds,
                    isActive: editingRole.isActive,
                  }
                : undefined
            }
            isEditing={!!editingRole}
            isOwner={isOwner}
            systemPermissions={systemPermissions}
            onSubmit={handleCreate}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingRole(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Modal de detalle */}
      <RoleDetail
        role={detailRole}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onEdit={handleEdit}
        onClone={handleClone}
        onDelete={handleDelete}
        isOwner={isOwner}
      />
    </div>
  );
}
