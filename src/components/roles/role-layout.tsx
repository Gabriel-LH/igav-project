// components/roles/RolesLayout.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Shield,
  Users,
  Plus,
  Lock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { RolesTable, Role } from "./table/roles-table";
import { RoleForm } from "./role-form";
import { RoleDetail } from "./role-details";

// Roles pre-creados para nuevo tenant (mejor práctica)
const DEFAULT_ROLES: Role[] = [
  {
    id: "role-owner",
    name: "Owner",
    description:
      "Acceso total al sistema. Puede gestionar roles, facturación y configuración avanzada.",
    isSystem: true,
    isActive: true,
    userCount: 1,
    permissionIds: ["*"], // Todos los permisos
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date(),
  },
  {
    id: "role-admin",
    name: "Administrador",
    description: "Gestión completa excepto facturación y roles de sistema.",
    isSystem: true,
    isActive: true,
    userCount: 2,
    permissionIds: [
      "sales_view",
      "sales_create",
      "sales_edit",
      "sales_delete",
      "sales_approve",
      "rent_view",
      "rent_create",
      "rent_edit",
      "rent_cancel",
      "rent_extend",
      "inventory_view",
      "inventory_create",
      "inventory_edit",
      "inventory_transfer",
      "cash_view",
      "cash_open",
      "cash_close",
      "cash_movement",
      "customers_view",
      "customers_create",
      "customers_edit",
      "reports_view",
      "reports_export",
      "reports_finance",
      "settings_general",
      "settings_team",
    ],
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date(),
  },
  {
    id: "role-employee",
    name: "Empleado",
    description:
      "Operaciones diarias: ventas, alquileres y atención al cliente.",
    isSystem: true,
    isActive: true,
    userCount: 5,
    permissionIds: [
      "sales_view",
      "sales_create",
      "rent_view",
      "rent_create",
      "inventory_view",
      "cash_view",
      "customers_view",
      "customers_create",
    ],
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date(),
  },
  {
    id: "role-cashier",
    name: "Cajero",
    description: "Enfocado en operaciones de caja y cobros.",
    isSystem: true,
    isActive: true,
    userCount: 3,
    permissionIds: [
      "sales_view",
      "sales_create",
      "rent_view",
      "rent_create",
      "cash_view",
      "cash_open",
      "cash_close",
      "cash_movement",
      "customers_view",
    ],
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date(),
  },
  {
    id: "role-custom",
    name: "Supervisor de Ventas",
    description: "Rol personalizado para supervisores con permisos extendidos.",
    isSystem: false,
    isActive: true,
    userCount: 0,
    permissionIds: [
      "sales_view",
      "sales_create",
      "sales_edit",
      "sales_approve",
      "rent_view",
      "rent_create",
      "rent_edit",
      "reports_view",
    ],
    createdAt: new Date("2024-06-15"),
    updatedAt: new Date("2024-06-15"),
  },
];

export function RolesLayout() {
  const [roles, setRoles] = useState<Role[]>(DEFAULT_ROLES);
  const [isOwner] = useState(true); // Esto vendría del contexto de auth

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [detailRole, setDetailRole] = useState<Role | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const stats = {
    total: roles.length,
    system: roles.filter((r) => r.isSystem).length,
    custom: roles.filter((r) => !r.isSystem).length,
    active: roles.filter((r) => r.isActive).length,
  };

  const handleCreate = (data: {
    name: string;
    description: string;
    isSystem: boolean;
    permissionIds: string[];
    isActive: boolean;
  }) => {
    const newRole: Role = {
      id: `role-${Date.now()}`,
      ...data,
      userCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (editingRole) {
      setRoles((prev) =>
        prev.map((r) =>
          r.id === editingRole.id
            ? { ...newRole, id: r.id, userCount: r.userCount }
            : r,
        ),
      );
    } else {
      setRoles((prev) => [...prev, newRole]);
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
    const cloned: Role = {
      ...role,
      id: `role-${Date.now()}`,
      name: `${role.name} (Copia)`,
      isSystem: false,
      userCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setRoles((prev) => [...prev, cloned]);
    setIsDetailOpen(false);
  };

  const handleDelete = (id: string) => {
    setRoles((prev) => prev.filter((r) => r.id !== id));
    setIsDetailOpen(false);
  };

  const handleToggleActive = (id: string, active: boolean) => {
    setRoles((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, isActive: active, updatedAt: new Date() } : r,
      ),
    );
  };

  const handleViewDetail = (role: Role) => {
    setDetailRole(role);
    setIsDetailOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4">
        <Button
          onClick={() => {
            setEditingRole(null);
            setIsFormOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Crear Rol
        </Button>
      </div>

      {/* Info de sistema */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">Roles pre-configurados</p>
          <p>
            Tu tenant incluye roles del sistema listos para usar: Owner,
            Administrador, Empleado y Cajero. Puedes crear roles personalizados
            adicionales según tus necesidades.
          </p>
        </div>
      </div>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Roles configurados
          </CardTitle>
          <CardDescription>
            Haz clic en cualquier rol para ver detalles, o usa el menú de
            acciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RolesTable
            data={roles}
            isOwner={isOwner}
            onEdit={handleEdit}
            onClone={handleClone}
            onDelete={handleDelete}
            onViewDetail={handleViewDetail}
            onToggleActive={handleToggleActive}
          />
        </CardContent>
      </Card>

      {/* Modal de creación/edición */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? "Editar Rol" : "Crear Nuevo Rol"}
            </DialogTitle>
          </DialogHeader>
          <RoleForm
            initialData={editingRole || undefined}
            isEditing={!!editingRole}
            isOwner={isOwner}
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
