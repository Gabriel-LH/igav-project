"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TenantPolicy } from "@/src/types/tenant/type.tenantPolicy";

interface PolicyConfigFormProps {
  policy: TenantPolicy;
  onChange: (section: keyof TenantPolicy, values: any) => void;
}

export function PolicyConfigForm({ policy, onChange }: PolicyConfigFormProps) {
  return (
    <div className="space-y-6">
      {/* Ventas */}
      <Card>
        <CardHeader>
          <CardTitle>Políticas de Venta</CardTitle>
          <CardDescription>
            Reglas aplicables a las operaciones de venta directa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Permitir Devoluciones</Label>
              <p className="text-sm text-muted-foreground">
                Define si se pueden realizar devoluciones de productos vendidos.
              </p>
            </div>
            <Switch
              checked={policy.sales.allowReturns}
              onCheckedChange={(checked) =>
                onChange("sales", { allowReturns: checked })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Días Máximos para Devolución</Label>
              <Input
                type="number"
                value={policy.sales.maxReturnDays}
                onChange={(e) =>
                  onChange("sales", { maxReturnDays: parseInt(e.target.value) || 0 })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alquileres */}
      <Card>
        <CardHeader>
          <CardTitle>Políticas de Alquiler</CardTitle>
          <CardDescription>
            Configuración crítica para el core de rentas e inventario.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Cálculo de Días Inclusivo</Label>
              <p className="text-sm text-muted-foreground">
                Entrega y devolución cuentan como dias completos (Ej: Lunes-Martes = 2 días).
              </p>
            </div>
            <Switch
              checked={policy.rentals.inclusiveDayCalculation}
              onCheckedChange={(checked) =>
                onChange("rentals", { inclusiveDayCalculation: checked })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Duración Predeterminada (Días)</Label>
              <Input
                type="number"
                value={policy.rentals.defaultRentalDurationDays}
                onChange={(e) =>
                  onChange("rentals", { defaultRentalDurationDays: parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Tolerancia de Retraso (Horas)</Label>
              <Input
                type="number"
                value={policy.rentals.lateToleranceHours}
                onChange={(e) =>
                  onChange("rentals", { lateToleranceHours: parseInt(e.target.value) || 0 })
                }
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Requerir Garantía</Label>
              <p className="text-sm text-muted-foreground">
                Obliga a registrar una garantía para todos los alquileres.
              </p>
            </div>
            <Switch
              checked={policy.rentals.requireGuarantee}
              onCheckedChange={(checked) =>
                onChange("rentals", { requireGuarantee: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Marcar como Atrasado Auto.</Label>
              <p className="text-sm text-muted-foreground">
                Marca alquileres vencidos tras superar la tolerancia.
              </p>
            </div>
            <Switch
              checked={policy.rentals.autoMarkAsLate}
              onCheckedChange={(checked) =>
                onChange("rentals", { autoMarkAsLate: checked })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Días en Lavandería</Label>
              <Input
                type="number"
                value={policy.rentals.defaultLaundryDays}
                onChange={(e) =>
                  onChange("rentals", { defaultLaundryDays: parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Días en Mantenimiento</Label>
              <Input
                type="number"
                value={policy.rentals.defaultMaintenanceDays}
                onChange={(e) =>
                  onChange("rentals", { defaultMaintenanceDays: parseInt(e.target.value) || 0 })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reservas */}
      <Card>
        <CardHeader>
          <CardTitle>Políticas de Reserva</CardTitle>
          <CardDescription>
            Gestión de apartados y expiración automática.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Expiración Automática</Label>
              <p className="text-sm text-muted-foreground">
                Cancela reservas que no se concretan en el tiempo límite.
              </p>
            </div>
            <Switch
              checked={policy.reservations.autoExpireReservations}
              onCheckedChange={(checked) =>
                onChange("reservations", { autoExpireReservations: checked })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Expirar tras (Horas)</Label>
              <Input
                type="number"
                value={policy.reservations.expireAfterHours}
                onChange={(e) =>
                  onChange("reservations", { expireAfterHours: parseInt(e.target.value) || 0 })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Inventario */}
      <Card>
        <CardHeader>
          <CardTitle>Políticas de Inventario</CardTitle>
          <CardDescription>Reglas de control de stock.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Bloquear Stock Reservado</Label>
              <p className="text-sm text-muted-foreground">
                Evita vender o alquilar productos que tienen reserva vigente.
              </p>
            </div>
            <Switch
              checked={policy.inventory.autoBlockStockIfReserved}
              onCheckedChange={(checked) =>
                onChange("inventory", { autoBlockStockIfReserved: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Financiero */}
      <Card>
        <CardHeader>
          <CardTitle>Políticas Financieras</CardTitle>
          <CardDescription>
            Control de créditos y saldos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Permitir Saldo Negativo</Label>
              <p className="text-sm text-muted-foreground">
                Permite que los clientes queden debiendo dinero.
              </p>
            </div>
            <Switch
              checked={policy.financial.allowNegativeBalance}
              onCheckedChange={(checked) =>
                onChange("financial", { allowNegativeBalance: checked })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Crédito Máximo por Cliente</Label>
              <Input
                type="number"
                value={policy.financial.maxCreditPerClient}
                onChange={(e) =>
                  onChange("financial", { maxCreditPerClient: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-Cargar por Daños</Label>
              <p className="text-sm text-muted-foreground">
                Aplica cargos automáticos si hay reporte de daños.
              </p>
            </div>
            <Switch
              checked={policy.financial.autoApplyChargesOnDamage}
              onCheckedChange={(checked) =>
                onChange("financial", { autoApplyChargesOnDamage: checked })
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
