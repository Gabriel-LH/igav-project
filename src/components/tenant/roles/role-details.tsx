// components/roles/RoleDetail.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Shield,
  Users,
  Lock,
  CheckCircle2,
  XCircle,
  Calendar,
  Edit3,
  Copy,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "./table/roles-table";

interface RoleDetailProps {
  role: Role | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (role: Role) => void;
  onClone: (role: Role) => void;
  onDelete: (id: string) => void;
  isOwner: boolean;
}

// Mock de usuarios asignados
const ASSIGNED_USERS_MOCK = [
  {
    id: "u1",
    name: "Carlos Rodríguez",
    email: "carlos@empresa.com",
    avatar: "",
  },
  { id: "u2", name: "Ana Martínez", email: "ana@empresa.com", avatar: "" },
];

// Mock de nombres de permisos
const PERMISSION_NAMES: Record<string, string> = {
  sales_view: "Ver ventas",
  sales_create: "Crear venta",
  inventory_view: "Ver inventario",
  // ... etc
};

export function RoleDetail({
  role,
  isOpen,
  onClose,
  onEdit,
  onClone,
  onDelete,
  isOwner,
}: RoleDetailProps) {
  if (!role) return null;

  const assignedUsers =
    role.userCount > 0 ? ASSIGNED_USERS_MOCK.slice(0, role.userCount) : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield
              className={cn(
                "w-5 h-5",
                role.isSystem ? "text-purple-600" : "text-blue-600",
              )}
            />
            {role.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Info general */}
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "p-3 rounded-lg",
                role.isSystem ? "bg-purple-100" : "bg-blue-100",
              )}
            >
              <Shield
                className={cn(
                  "w-8 h-8",
                  role.isSystem ? "text-purple-600" : "text-blue-600",
                )}
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold">{role.name}</h3>
                {role.isSystem && (
                  <Badge
                    variant="outline"
                    className="bg-purple-50 text-purple-700"
                  >
                    <Lock className="w-3 h-3 mr-1" />
                    Sistema
                  </Badge>
                )}
                <Badge
                  variant={role.isActive ? "default" : "secondary"}
                  className={cn(
                    role.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700",
                  )}
                >
                  {role.isActive ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Activo
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 mr-1" /> Inactivo
                    </>
                  )}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {role.description || "Sin descripción"}
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Creado: {new Date(role.createdAt).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Actualizado: {new Date(role.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Permisos */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Permisos asignados ({role.permissionIds.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48">
                <div className="flex flex-wrap gap-2">
                  {role.permissionIds.map((permId) => (
                    <Badge key={permId} variant="secondary" className="text-xs">
                      {PERMISSION_NAMES[permId] || permId}
                    </Badge>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Usuarios asignados */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4" />
                Usuarios con este rol ({role.userCount})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assignedUsers.length > 0 ? (
                <div className="space-y-2">
                  {assignedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-2 rounded-lg border"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay usuarios asignados a este rol
                </p>
              )}
            </CardContent>
          </Card>

          {/* Acciones */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onClone(role)}
              className="gap-2"
            >
              <Copy className="w-4 h-4" />
              Duplicar
            </Button>
            <Button
              variant="outline"
              onClick={() => onEdit(role)}
              className="gap-2"
            >
              <Edit3 className="w-4 h-4" />
              Editar
            </Button>
            {!role.isSystem && (
              <Button
                variant="destructive"
                onClick={() => onDelete(role.id)}
                disabled={role.userCount > 0}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
