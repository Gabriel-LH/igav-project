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
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Shield,
  Users as UsersIcon,
  Calendar,
  Edit3,
  Copy,
  Trash2,
  Fingerprint,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "./table/roles-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface RoleDetailProps {
  role: Role | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (role: Role) => void;
  onClone: (role: Role) => void;
  onDelete: (id: string) => void;
  isOwner: boolean;
}

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

  const assignedUsers = role.users || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
        {/* Header with Background/Gradient */}
        <div className={cn(
          "relative flex items-end p-6 bg-cover rounded-t-2xl bg-center",
          role.isSystem 
            ? "bg-linear-to-r from-purple-900 via-indigo-900 to-blue-900" 
            : "bg-linear-to-r from-blue-900 via-indigo-900 to-purple-900"
        )}>
          <DialogHeader className="sr-only">
            <DialogTitle>{role.name}</DialogTitle>
          </DialogHeader>

          <div className="absolute top-7 right-10 flex gap-2">
            <Badge variant="outline" className="bg-white/10 text-white border-white/20 backdrop-blur-md">
              {role.isSystem ? "Sistema" : "Personalizado"}
            </Badge>
          </div>
          
          <div className="flex items-center gap-4 text-white z-10 w-full">
            <div className="p-3 bg-white/20 backdrop-blur-xl rounded-2xl border border-white/30 shadow-lg shrink-0">
              <Shield className="w-8 h-8" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-bold tracking-tight leading-none mb-1 truncate">{role.name}</h2>
              <p className="text-white/70 text-sm line-clamp-1">{role.description || "Sin descripción proporcionada"}</p>
            </div>
          </div>
        </div>

        <ScrollArea className="max-h-[60vh]">
          <div className="p-6 space-y-8">
            {/* 1. Información General Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary font-bold uppercase text-[10px] tracking-wider">
                <Info className="w-3 h-3" />
                Resumen del Rol
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">Estado Actual</span>
                  {role.isActive ? (
                    <div className="flex items-center gap-2 text-green-600 font-semibold text-sm">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      Activo y Operativo
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-600 font-semibold text-sm">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      Inactivo
                    </div>
                  )}
                </div>
                <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">Fecha de Creación</span>
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    {new Date(role.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">Impacto (Usuarios)</span>
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <UsersIcon className="w-3.5 h-3.5 text-primary" />
                    {role.userCount} personas asignadas
                  </div>
                </div>
              </div>
            </div>

            <Separator className="opacity-50" />

            {/* 2. Permisos Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary font-bold uppercase text-[10px] tracking-wider">
                <Fingerprint className="w-3 h-3" />
                Capacidades de Acceso ({role.permissionIds.length})
              </div>
              <div className="bg-muted/20 border rounded-2xl p-4">
                <div className="flex flex-wrap gap-2">
                  {role.permissionIds.map((permId) => (
                    <Badge 
                      key={permId} 
                      variant="secondary" 
                      className="bg-background border shadow-sm text-[11px] font-medium py-1 px-3"
                    >
                      {permId.replace('.', ' • ')}
                    </Badge>
                  ))}
                  {role.permissionIds.length === 0 && (
                    <div className="text-xs text-muted-foreground italic w-full text-center py-4">
                      Este rol no tiene permisos específicos asignados.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Separator className="opacity-50" />

            {/* 3. Personal Asignado Section */}
            <div className="space-y-4 ">
              <div className="flex items-center gap-2 text-primary font-bold uppercase text-[10px] tracking-wider">
                <UsersIcon className="w-3 h-3" />
                Personal con este Rol
              </div>
              <div className="grid grid-cols-1 gap-3">
                {assignedUsers.length > 0 ? (
                  assignedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-transparent hover:border-primary/20 hover:bg-muted/50 transition-all group"
                    >
                      <Avatar className="h-10 w-10 border-2 border-background shadow-md">
                        <AvatarImage src={user.image || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                          {user.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate group-hover:text-primary transition-colors leading-tight">
                          {user.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate font-medium">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full flex flex-col items-center justify-center py-12 rounded-2xl border-2 border-dashed border-muted/50 opacity-40">
                    <UsersIcon className="w-10 h-10 mb-2" />
                    <p className="text-sm font-medium">Sin usuarios registrados con este rol</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="bg-muted/40 p-5 border-t rounded-b-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
            Última actualización: {new Date(role.updatedAt).toLocaleString()}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onClone(role)}
              className="h-9 px-4 gap-2 rounded-xl hover:bg-background hover:text-primary transition-all border-border/60"
            >
              <Copy className="w-3.5 h-3.5" />
              Duplicar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(role)}
              className="h-9 px-4 gap-2 rounded-xl hover:bg-background hover:text-primary transition-all border-border/60"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Editar
            </Button>
            {!role.isSystem && isOwner && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(role.id)}
                disabled={role.userCount > 0}
                className="h-9 px-4 gap-2 rounded-xl transition-all shadow-lg shadow-red-500/10"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
