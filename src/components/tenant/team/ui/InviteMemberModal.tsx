// components/team/InviteMemberModal.tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/badge";
import { Plus, Mail, Building2, Shield, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLES = [
  { value: "admin", label: "Administrador", description: "Acceso total al sistema" },
  { value: "manager", label: "Gerente", description: "Gestión de sucursal y equipo" },
  { value: "seller", label: "Vendedor", description: "Ventas y atención al cliente" },
  { value: "inventory", label: "Inventario", description: "Gestión de stock y productos" },
  { value: "viewer", label: "Visualizador", description: "Solo lectura de reportes" },
];

const EXTRA_PERMISSIONS = [
  { id: "approve_transfers", label: "Aprobar transferencias", description: "Puede autorizar traslados entre sucursales" },
  { id: "manage_prices", label: "Gestionar precios", description: "Modificar precios de renta y venta" },
  { id: "view_reports", label: "Ver reportes financieros", description: "Acceso a estadísticas y métricas" },
  { id: "export_data", label: "Exportar datos", description: "Descargar reportes en Excel/CSV" },
  { id: "bulk_operations", label: "Operaciones masivas", description: "Importar/actualizar productos en bulk" },
];

interface InviteMemberModalProps {
  branches: Array<{ id: string; name: string }>;
  onInvite: (data: {
    email: string;
    name: string;
    role: string;
    branchId: string;
    permissions: string[];
    message?: string;
  }) => void;
}

export function InviteMemberModal({ branches, onInvite }: InviteMemberModalProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    role: "",
    branchId: "",
    permissions: [] as string[],
    message: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    await onInvite(formData);
    
    setIsLoading(false);
    setOpen(false);
    setFormData({
      email: "",
      name: "",
      role: "",
      branchId: "",
      permissions: [],
      message: "",
    });
  };

  const togglePermission = (permissionId: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter((p) => p !== permissionId)
        : [...prev.permissions, permissionId],
    }));
  };

  const selectedRole = ROLES.find((r) => r.value === formData.role);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Invitar trabajador
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Invitar nuevo miembro
          </DialogTitle>
          <DialogDescription>
            Envía una invitación por email para unirse a tu equipo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-1">
              Correo electrónico
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="trabajador@empresa.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="name">Nombre completo</Label>
            <Input
              id="name"
              placeholder="Juan Pérez"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          {/* Rol */}
          <div className="space-y-2">
            <Label htmlFor="role" className="flex items-center gap-1">
              Rol
              <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.role}
              onValueChange={(val) => setFormData({ ...formData, role: val })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar rol..." />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{role.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {role.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedRole && (
              <p className="text-xs text-muted-foreground">
                {selectedRole.description}
              </p>
            )}
          </div>

          {/* Sucursal */}
          <div className="space-y-2">
            <Label htmlFor="branch" className="flex items-center gap-1">
              <Building2 className="w-4 h-4" />
              Sucursal por defecto
              <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.branchId}
              onValueChange={(val) => setFormData({ ...formData, branchId: val })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar sucursal..." />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Permisos extra */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Permisos adicionales (opcional)
            </Label>
            <div className="space-y-2">
              {EXTRA_PERMISSIONS.map((permission) => (
                <div
                  key={permission.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                    formData.permissions.includes(permission.id)
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  )}
                  onClick={() => togglePermission(permission.id)}
                >
                  <Checkbox
                    checked={formData.permissions.includes(permission.id)}
                    onCheckedChange={() => togglePermission(permission.id)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{permission.label}</span>
                      {formData.permissions.includes(permission.id) && (
                        <Badge variant="secondary" className="text-xs">Activo</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {permission.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mensaje personalizado */}
          <div className="space-y-2">
            <Label htmlFor="message">Mensaje personalizado (opcional)</Label>
            <Textarea
              id="message"
              placeholder="Hola, te invitamos a unirte a nuestro equipo en [Nombre de la Empresa]..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Este mensaje se incluirá en el email de invitación.
            </p>
          </div>

          {/* Resumen */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <p className="text-sm font-medium">Resumen de invitación:</p>
            <div className="text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">Para:</span>{" "}
                {formData.email || "—"}
              </p>
              <p>
                <span className="text-muted-foreground">Rol:</span>{" "}
                {selectedRole?.label || "—"}
              </p>
              <p>
                <span className="text-muted-foreground">Permisos extra:</span>{" "}
                {formData.permissions.length > 0
                  ? `${formData.permissions.length} seleccionados`
                  : "Ninguno"}
              </p>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="gap-2"
              disabled={
                !formData.email ||
                !formData.role ||
                !formData.branchId ||
                isLoading
              }
            >
              <Send className="w-4 h-4" />
              {isLoading ? "Enviando..." : "Enviar invitación"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}