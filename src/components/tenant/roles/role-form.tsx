// components/roles/RoleForm.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/badge";
import { Checkbox } from "@/components/ui/checkbox";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Shield,
  CheckSquare,
  Save,
  X,
  Lock,
  Unlock,
  Check,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowReloadHorizontalIcon,
  Building01Icon,
  Calendar03Icon,
  Clock01Icon,
  DiscountTag01Icon,
  GiftIcon,
  Invoice01Icon,
  Key01Icon,
  LockKeyIcon,
  PackageIcon,
  SaleTag01Icon,
  ShieldIcon,
  ShoppingBag01Icon,
  UserGroup03Icon,
  UserShield01Icon,
  UserSwitchIcon,
} from "@hugeicons/core-free-icons";

// MODULE LABELS — map DB module keys to friendly names
const MODULE_LABELS: Record<string, { label: string; icon: React.ReactNode }> =
  {
    sales: { label: "Ventas", icon: <HugeiconsIcon icon={SaleTag01Icon} /> },
    rentals: {
      label: "Alquiler",
      icon: <HugeiconsIcon icon={ArrowReloadHorizontalIcon} />,
    },
    reservations: {
      label: "Reservas",
      icon: <HugeiconsIcon icon={Calendar03Icon} />,
    },
    inventory: {
      label: "Inventario",
      icon: <HugeiconsIcon icon={PackageIcon} />,
    },
    clients: {
      label: "Clientes",
      icon: <HugeiconsIcon icon={UserGroup03Icon} />,
    },
    products: {
      label: "Productos",
      icon: <HugeiconsIcon icon={ShoppingBag01Icon} />,
    },
    promotions: {
      label: "Promociones",
      icon: <HugeiconsIcon icon={DiscountTag01Icon} />,
    },
    payments: { label: "Pagos", icon: <HugeiconsIcon icon={Invoice01Icon} /> },
    referrals: {
      label: "Referidos",
      icon: <HugeiconsIcon icon={UserSwitchIcon} />,
    },
    referralRewards: {
      label: "Recompensas",
      icon: <HugeiconsIcon icon={GiftIcon} />,
    },
    users: { label: "Equipo", icon: <HugeiconsIcon icon={UserGroup03Icon} /> },
    roles: { label: "Roles", icon: <HugeiconsIcon icon={ShieldIcon} /> },
    branches: {
      label: "Sucursales",
      icon: <HugeiconsIcon icon={Building01Icon} />,
    },
    userAttendance: {
      label: "Asistencia",
      icon: <HugeiconsIcon icon={Clock01Icon} />,
    },
    userBranchAccess: {
      label: "Acceso Sucursal",
      icon: <HugeiconsIcon icon={Key01Icon} />,
    },
    userTenantMembership: {
      label: "Membresías",
      icon: <HugeiconsIcon icon={UserShield01Icon} />,
    },
    permissions: {
      label: "Permisos (Sistema)",
      icon: <HugeiconsIcon icon={LockKeyIcon} />,
    },
    tenants: {
      label: "Tenants (Sistema)",
      icon: <HugeiconsIcon icon={Building01Icon} />,
    },
  };

// (old PERMISSIONS_STRUCTURE removed — now built dynamically from DB)

type SystemPermission = {
  id: string;
  key: string;
  module: string;
  description: string | null;
};

interface RoleFormData {
  name: string;
  description: string;
  isSystem: boolean;
  permissionIds: string[];
  isActive: boolean;
}

interface RoleFormProps {
  initialData?: Partial<RoleFormData>;
  isEditing?: boolean;
  isOwner?: boolean;
  systemPermissions: SystemPermission[]; // from DB (tenantId = null)
  onSubmit: (data: RoleFormData) => void;
  onCancel: () => void;
}

export function RoleForm({
  initialData,
  isEditing = false,
  isOwner = false,
  systemPermissions,
  onSubmit,
  onCancel,
}: RoleFormProps) {
  // Build module structure dynamically from DB permissions
  const permissionsByModule = systemPermissions.reduce<
    Record<
      string,
      { label: string; icon: string; permissions: SystemPermission[] }
    >
  >((acc, perm) => {
    const meta = MODULE_LABELS[perm.module] ?? {
      label: perm.module,
      icon: "🔒",
    };
    if (!acc[perm.module]) acc[perm.module] = { ...meta, permissions: [] };
    acc[perm.module].permissions.push(perm);
    return acc;
  }, {});
  const [formData, setFormData] = useState<RoleFormData>({
    name: "",
    description: "",
    isSystem: false,
    permissionIds: [],
    isActive: true,
    ...initialData,
  });

  const [expandedModules, setExpandedModules] = useState<string[]>(
    Object.keys(permissionsByModule),
  );

  const toggleModule = (moduleKey: string) => {
    setExpandedModules((prev) =>
      prev.includes(moduleKey)
        ? prev.filter((k) => k !== moduleKey)
        : [...prev, moduleKey],
    );
  };

  const togglePermission = (permissionId: string) => {
    setFormData((prev) => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(permissionId)
        ? prev.permissionIds.filter((id) => id !== permissionId)
        : [...prev.permissionIds, permissionId],
    }));
  };

  const toggleAllModule = (moduleKey: string, checked: boolean) => {
    const mod = permissionsByModule[moduleKey];
    if (!mod) return;
    const modulePermissionIds = mod.permissions.map((p) => p.key);

    setFormData((prev) => ({
      ...prev,
      permissionIds: checked
        ? [...new Set([...prev.permissionIds, ...modulePermissionIds])]
        : prev.permissionIds.filter((id) => !modulePermissionIds.includes(id)),
    }));
  };

  const isModuleFullySelected = (moduleKey: string) => {
    const mod = permissionsByModule[moduleKey];
    if (!mod) return false;
    return mod.permissions.every((p) => formData.permissionIds.includes(p.key));
  };

  const isModulePartiallySelected = (moduleKey: string) => {
    const mod = permissionsByModule[moduleKey];
    if (!mod) return false;
    const selectedCount = mod.permissions.filter((p) =>
      formData.permissionIds.includes(p.key),
    ).length;
    return selectedCount > 0 && selectedCount < mod.permissions.length;
  };

  const grantAllPermissions = () => {
    const allIds = systemPermissions.map((p) => p.key);
    setFormData((prev) => ({ ...prev, permissionIds: allIds }));
  };

  const revokeAllPermissions = () => {
    setFormData((prev) => ({ ...prev, permissionIds: [] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const totalPermissions = systemPermissions.length;
  const selectedCount = formData.permissionIds.length;
  const progressPercent =
    totalPermissions > 0
      ? Math.round((selectedCount / totalPermissions) * 100)
      : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Sección superior: Datos básicos */}
      <div className="shadow-sm border rounded-xl overflow-hidden">
        <div className="border-b p-2">
          <span className="flex items-center gap-2 text-lg">
            <div className="p-1.5 bg-blue-100 rounded-md">
              <Shield className="w-4 h-4 text-blue-600" />
            </div>
            Información del Rol
          </span>
          <p className="text-sm text-slate-500">
            Define el nombre y responsabilidades principales de este rol.
          </p>
        </div>
        <div className="p-2">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <Label
                htmlFor="name"
                className="text-slate-400 font-semibold text-xs uppercase tracking-wide"
              >
                Nombre del rol <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Ej: Supervisor de Ventas"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            {isOwner && (
              <div
                className={cn(
                  "flex items-center justify-between p-4 border rounded-xl transition-colors",
                  formData.isSystem
                    ? "bg-purple-300/30 border-purple-400"
                    : "bg-slate-900/30 border-slate-900",
                )}
              >
                <div className="space-y-1">
                  <Label
                    className="flex items-center gap-2 text-slate-400 font-semibold cursor-pointer"
                    htmlFor="system-role"
                  >
                    <div
                      className={cn(
                        "p-1.5 rounded-md",
                        formData.isSystem
                          ? "bg-purple-100 text-purple-600"
                          : "bg-slate-200 text-slate-500",
                      )}
                    >
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    Rol del sistema
                  </Label>
                  <p className="text-[11px] text-muted-foreground ml-8">
                    No se puede eliminar, solo editar permisos
                  </p>
                </div>
                <Switch
                  id="system-role"
                  checked={formData.isSystem}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isSystem: checked })
                  }
                  className="data-[state=checked]:bg-purple-600"
                />
              </div>
            )}

            <div className="space-y-3 md:col-span-2">
              <Label
                htmlFor="description"
                className="text-slate-400 font-semibold text-xs uppercase tracking-wide"
              >
                Descripción
              </Label>
              <Textarea
                id="description"
                placeholder="Describe qué hace este rol, a qué información tiene acceso y sus responsabilidades principales..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="bg-slate-50/50 min-h-[80px] resize-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="border p-2 rounded-xl shadow-sm overflow-hidden">
        <div className="border-b pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="flex items-center gap-2 text-lg text-slate-400">
                <div className="p-1.5 bg-indigo-100 rounded-md">
                  <CheckSquare className="w-4 h-4 text-indigo-600" />
                </div>
                Matriz de Permisos
              </span>
              <p className="mt-1 text-xs">
                Selecciona las acciones y módulos a los que este rol tendrá
                acceso.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-slate-900/30 px-4 py-2 rounded-xl border border-slate-900 shadow-sm">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Cobertura
                </span>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="font-mono bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border-indigo-100"
                  >
                    {selectedCount} / {totalPermissions}
                  </Badge>
                  <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 transition-all duration-500 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-0 px-0">
          {/* Acciones globales */}
          <div className="flex flex-wrap items-center gap-2 p-3 border-b  mb-4 px-6">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={grantAllPermissions}
              className="gap-2 h-8 text-xs bg-white border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors"
            >
              <Unlock className="w-3.5 h-3.5" />
              Otorgar todos
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={revokeAllPermissions}
              className="gap-2 h-8 text-xs bg-white border-slate-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              Revocar todos
            </Button>
            <Separator orientation="vertical" className="h-4 mx-1" />
            <span className="text-xs font-medium text-slate-500">
              {progressPercent}% de permisos asignados
            </span>
          </div>

          {/* Acordeón de módulos */}
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {Object.entries(permissionsByModule).map(([key, mod]) => {
                const fullySelected = isModuleFullySelected(key);
                const partiallySelected = isModulePartiallySelected(key);
                const isExpanded = expandedModules.includes(key);

                return (
                  <div
                    key={key}
                    className={cn(
                      "border rounded-xl overflow-hidden transition-all duration-300",
                      fullySelected
                        ? "border-indigo-900 bg-indigo-50/10 shadow-sm"
                        : "border-slate-800/30 bg-slate-900/30 hover:border-indigo-900 hover:shadow-sm",
                    )}
                  >
                    {/* Header del módulo */}
                    <div
                      className={cn(
                        "flex items-center gap-3 p-3 transition-colors",
                        fullySelected
                          ? "bg-indigo-900/30"
                          : partiallySelected
                            ? "bg-slate-800/30"
                            : "bg-slate-900/30",
                      )}
                    >
                      <Checkbox
                        checked={fullySelected}
                        onCheckedChange={(checked) =>
                          toggleAllModule(key, checked as boolean)
                        }
                        className={cn(
                          "transition-colors",
                          fullySelected
                            ? "data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                            : partiallySelected
                              ? "bg-slate-900/30 border-slate-800/50 text-transparent"
                              : "",
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => toggleModule(key)}
                        className="flex-1 flex items-center gap-3 text-left focus:outline-none"
                      >
                        <div
                          className={cn(
                            "flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
                            fullySelected
                              ? "bg-indigo-200 text-indigo-700"
                              : "bg-slate-100 text-slate-900",
                          )}
                        >
                          <span className="text-lg">{mod.icon}</span>
                        </div>
                        <span
                          className={cn(
                            "font-bold",
                            fullySelected
                              ? "text-indigo-200"
                              : "text-slate-200",
                          )}
                        >
                          {mod.label}
                        </span>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "ml-2 text-[10px] uppercase font-bold",
                            fullySelected
                              ? "bg-indigo-100 text-indigo-700"
                              : "bg-slate-100 text-slate-500",
                          )}
                        >
                          {mod.permissions.length} permisos
                        </Badge>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 ml-auto text-slate-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 ml-auto text-slate-400" />
                        )}
                      </button>
                    </div>

                    {/* Contenido del módulo */}
                    {isExpanded && (
                      <div className="p-3 bg-slate-900/30 grid gap-2">
                        {mod.permissions.map((permission) => {
                          const isSelected = formData.permissionIds.includes(
                            permission.key,
                          );

                          return (
                            <div
                              key={permission.key}
                              className={cn(
                                "flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer group",
                                isSelected
                                  ? "border-indigo-900/30 bg-indigo-900/30 shadow-sm"
                                  : "border-slate-700/50 hover:border-slate-700 hover:bg-slate-700/50",
                              )}
                              onClick={() => togglePermission(permission.key)}
                            >
                              <div 
                                onClick={(e) => e.stopPropagation()} 
                                className="flex items-center"
                              >
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() =>
                                    togglePermission(permission.key)
                                  }
                                  className="mt-0.5 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={cn(
                                      "font-bold text-sm capitalize transition-colors",
                                      isSelected
                                        ? "text-indigo-300"
                                        : "text-slate-300",
                                    )}
                                  >
                                    {permission.key
                                      .split(".")[1]
                                      ?.replace(/([A-Z])/g, " $1") ??
                                      permission.key}
                                  </span>
                                  {isSelected && (
                                    <Check className="w-3.5 h-3.5 text-indigo-400 animate-in zoom-in duration-200" />
                                  )}
                                </div>
                                <p
                                  className={cn(
                                    "text-xs mt-0.5",
                                    isSelected
                                      ? "text-indigo-400/70"
                                      : "text-slate-500",
                                  )}
                                >
                                  {permission.description}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={!formData.name || formData.permissionIds.length === 0}
          className="gap-2"
        >
          <Save className="w-4 h-4" />
          {isEditing ? "Guardar cambios" : "Crear rol"}
        </Button>
      </div>
    </form>
  );
}
