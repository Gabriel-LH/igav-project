// components/roles/RoleForm.tsx
"use client";

import { useState, useEffect } from "react";
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
  Square,
  Copy,
  Save,
  X,
  Lock,
  Unlock,
  Check,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Estructura de permisos por módulo
const PERMISSIONS_STRUCTURE = {
  ventas: {
    label: "Ventas",
    icon: "💰",
    permissions: [
      {
        id: "sales_view",
        label: "Ver ventas",
        description: "Ver listado de ventas",
      },
      {
        id: "sales_create",
        label: "Crear venta",
        description: "Registrar nueva venta",
      },
      {
        id: "sales_edit",
        label: "Editar venta",
        description: "Modificar ventas existentes",
      },
      {
        id: "sales_delete",
        label: "Eliminar venta",
        description: "Eliminar ventas (solo propias)",
      },
      {
        id: "sales_approve",
        label: "Aprobar descuentos",
        description: "Autorizar descuentos especiales",
      },
      {
        id: "sales_refund",
        label: "Procesar devoluciones",
        description: "Generar notas de crédito",
      },
    ],
  },
  alquiler: {
    label: "Alquiler",
    icon: "📦",
    permissions: [
      {
        id: "rent_view",
        label: "Ver alquileres",
        description: "Ver listado de alquileres",
      },
      {
        id: "rent_create",
        label: "Crear alquiler",
        description: "Registrar nuevo alquiler",
      },
      {
        id: "rent_edit",
        label: "Editar alquiler",
        description: "Modificar alquileres activos",
      },
      {
        id: "rent_cancel",
        label: "Cancelar alquiler",
        description: "Cancelar antes de entrega",
      },
      {
        id: "rent_extend",
        label: "Extender plazo",
        description: "Ampliar fecha de devolución",
      },
      {
        id: "rent_return",
        label: "Procesar devolución",
        description: "Registrar devolución de items",
      },
    ],
  },
  inventario: {
    label: "Inventario",
    icon: "📋",
    permissions: [
      {
        id: "inventory_view",
        label: "Ver inventario",
        description: "Ver stock disponible",
      },
      {
        id: "inventory_create",
        label: "Crear productos",
        description: "Agregar nuevos productos",
      },
      {
        id: "inventory_edit",
        label: "Editar productos",
        description: "Modificar información",
      },
      {
        id: "inventory_transfer",
        label: "Transferir stock",
        description: "Mover entre sucursales",
      },
      {
        id: "inventory_adjust",
        label: "Ajustar stock",
        description: "Corregir cantidades",
      },
      {
        id: "inventory_bulk",
        label: "Operaciones masivas",
        description: "Importar/actualizar en bulk",
      },
    ],
  },
  caja: {
    label: "Caja",
    icon: "💵",
    permissions: [
      { id: "cash_view", label: "Ver caja", description: "Ver estado de caja" },
      {
        id: "cash_open",
        label: "Abrir caja",
        description: "Iniciar turno de caja",
      },
      {
        id: "cash_close",
        label: "Cerrar caja",
        description: "Finalizar turno y arqueo",
      },
      {
        id: "cash_movement",
        label: "Movimientos",
        description: "Registrar ingresos/egresos",
      },
      {
        id: "cash_reconcile",
        label: "Cuadrar caja",
        description: "Ajustar diferencias",
      },
    ],
  },
  clientes: {
    label: "Clientes",
    icon: "👥",
    permissions: [
      {
        id: "customers_view",
        label: "Ver clientes",
        description: "Ver listado de clientes",
      },
      {
        id: "customers_create",
        label: "Crear cliente",
        description: "Registrar nuevo cliente",
      },
      {
        id: "customers_edit",
        label: "Editar cliente",
        description: "Modificar información",
      },
      {
        id: "customers_delete",
        label: "Eliminar cliente",
        description: "Eliminar (solo sin historial)",
      },
      {
        id: "customers_credit",
        label: "Gestionar crédito",
        description: "Asignar líneas de crédito",
      },
    ],
  },
  reportes: {
    label: "Reportes",
    icon: "📊",
    permissions: [
      {
        id: "reports_view",
        label: "Ver reportes",
        description: "Acceder a dashboard",
      },
      {
        id: "reports_export",
        label: "Exportar datos",
        description: "Descargar Excel/CSV/PDF",
      },
      {
        id: "reports_finance",
        label: "Reportes financieros",
        description: "Ver ingresos y métricas",
      },
    ],
  },
  configuracion: {
    label: "Configuración",
    icon: "⚙️",
    permissions: [
      {
        id: "settings_general",
        label: "Configuración general",
        description: "Ajustes de la empresa",
      },
      {
        id: "settings_team",
        label: "Gestionar equipo",
        description: "Crear/editar usuarios",
      },
      {
        id: "settings_roles",
        label: "Roles y permisos",
        description: "Solo para Owner/Admin",
      },
      {
        id: "settings_billing",
        label: "Facturación",
        description: "Gestionar suscripción",
      },
    ],
  },
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
  onSubmit: (data: RoleFormData) => void;
  onCancel: () => void;
}

export function RoleForm({
  initialData,
  isEditing = false,
  isOwner = false,
  onSubmit,
  onCancel,
}: RoleFormProps) {
  const [formData, setFormData] = useState<RoleFormData>({
    name: "",
    description: "",
    isSystem: false,
    permissionIds: [],
    isActive: true,
    ...initialData,
  });

  const [expandedModules, setExpandedModules] = useState<string[]>(
    Object.keys(PERMISSIONS_STRUCTURE),
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
    const module =
      PERMISSIONS_STRUCTURE[moduleKey as keyof typeof PERMISSIONS_STRUCTURE];
    const modulePermissionIds = module.permissions.map((p) => p.id);

    setFormData((prev) => ({
      ...prev,
      permissionIds: checked
        ? [...new Set([...prev.permissionIds, ...modulePermissionIds])]
        : prev.permissionIds.filter((id) => !modulePermissionIds.includes(id)),
    }));
  };

  const isModuleFullySelected = (moduleKey: string) => {
    const module =
      PERMISSIONS_STRUCTURE[moduleKey as keyof typeof PERMISSIONS_STRUCTURE];
    return module.permissions.every((p) =>
      formData.permissionIds.includes(p.id),
    );
  };

  const isModulePartiallySelected = (moduleKey: string) => {
    const module =
      PERMISSIONS_STRUCTURE[moduleKey as keyof typeof PERMISSIONS_STRUCTURE];
    const selectedCount = module.permissions.filter((p) =>
      formData.permissionIds.includes(p.id),
    ).length;
    return selectedCount > 0 && selectedCount < module.permissions.length;
  };

  const grantAllPermissions = () => {
    const allIds = Object.values(PERMISSIONS_STRUCTURE).flatMap((m) =>
      m.permissions.map((p) => p.id),
    );
    setFormData((prev) => ({ ...prev, permissionIds: allIds }));
  };

  const revokeAllPermissions = () => {
    setFormData((prev) => ({ ...prev, permissionIds: [] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const totalPermissions = Object.values(PERMISSIONS_STRUCTURE).reduce(
    (acc, m) => acc + m.permissions.length,
    0,
  );
  const selectedCount = formData.permissionIds.length;
  const progressPercent = Math.round((selectedCount / totalPermissions) * 100);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Sección superior: Datos básicos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Información del Rol
          </CardTitle>
          <CardDescription>
            Define el nombre y propiedades del rol
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">
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
              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Rol del sistema
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    No se puede eliminar, solo editar permisos
                  </p>
                </div>
                <Switch
                  checked={formData.isSystem}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isSystem: checked })
                  }
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Describe las responsabilidades de este rol..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Sección inferior: Matriz de permisos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5" />
                Permisos del Rol
              </CardTitle>
              <CardDescription>
                Selecciona las acciones que puede realizar este rol
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">
                {selectedCount} / {totalPermissions}
              </Badge>
              <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Acciones globales */}
          <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={grantAllPermissions}
              className="gap-2"
            >
              <Unlock className="w-4 h-4" />
              Otorgar todos
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={revokeAllPermissions}
              className="gap-2"
            >
              <Lock className="w-4 h-4" />
              Revocar todos
            </Button>
            <Separator orientation="vertical" className="h-8" />
            <span className="text-sm text-muted-foreground self-center">
              {progressPercent}% de permisos asignados
            </span>
          </div>

          {/* Acordeón de módulos */}
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {Object.entries(PERMISSIONS_STRUCTURE).map(([key, module]) => {
                const fullySelected = isModuleFullySelected(key);
                const partiallySelected = isModulePartiallySelected(key);
                const isExpanded = expandedModules.includes(key);

                return (
                  <div key={key} className="border rounded-lg overflow-hidden">
                    {/* Header del módulo */}
                    <div className="flex items-center gap-3 p-3 bg-muted/30">
                      <Checkbox
                        checked={fullySelected}
                        onCheckedChange={(checked) =>
                          toggleAllModule(key, checked as boolean)
                        }
                        className={cn(partiallySelected && "bg-primary/50")}
                      />
                      <button
                        type="button"
                        onClick={() => toggleModule(key)}
                        className="flex-1 flex items-center gap-2 text-left"
                      >
                        <span className="text-lg">{module.icon}</span>
                        <span className="font-semibold">{module.label}</span>
                        <Badge variant="secondary" className="ml-2">
                          {module.permissions.length} permisos
                        </Badge>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 ml-auto text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
                        )}
                      </button>
                    </div>

                    {/* Contenido del módulo */}
                    {isExpanded && (
                      <div className="p-3 space-y-2">
                        {module.permissions.map((permission) => {
                          const isSelected = formData.permissionIds.includes(
                            permission.id,
                          );

                          return (
                            <div
                              key={permission.id}
                              className={cn(
                                "flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                                isSelected
                                  ? "border-primary bg-primary/5"
                                  : "hover:bg-muted/50",
                              )}
                              onClick={() => togglePermission(permission.id)}
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() =>
                                  togglePermission(permission.id)
                                }
                                className="mt-0.5"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">
                                    {permission.label}
                                  </span>
                                  {isSelected && (
                                    <Check className="w-3 h-3 text-primary" />
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
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
        </CardContent>
      </Card>

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
