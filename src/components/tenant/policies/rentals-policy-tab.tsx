// components/tenant-policies/tabs/RentalsPoliciesTab.tsx
"use client";

import { useFormContext } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
  FormControl,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { TenantPolicy } from "@/src/types/tenant/type.tenantPolicy";

export function RentalsPoliciesTab() {
  const { control } = useFormContext<TenantPolicy>();

  return (
    <div className="space-y-4">
      {/* Retrasos */}
      <Card>
        <CardHeader>
          <div className="flex items-center mt-1 justify-between">
            <CardTitle className="flex items-center gap-2">Retrasos</CardTitle>
          </div>
          <CardDescription>
            Configura cómo el sistema maneja los retrasos en devoluciones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={control}
            name="rentals.allowLateReturn"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Permitir devolución tardía
                  </FormLabel>
                  <FormDescription>
                    Permitir que los clientes devuelvan después de la fecha
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="rentals.lateToleranceHours"
            render={({ field }) => (
              <FormItem className="mb-3">
                <FormLabel>Horas de tolerancia</FormLabel>
                <FormControl>
                  <div className="relative w-fit">
                    <Input
                      type="number"
                      min="0"
                      value={field.value}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                    <span className="absolute right-9 top-1.5 text-muted-foreground">
                      horas
                    </span>
                  </div>
                </FormControl>
                <FormDescription>
                  Tiempo de gracia antes de considerar atrasado
                </FormDescription>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Garantía */}
      <Card>
        <CardHeader className="-mb-4">
          <CardTitle className="flex items-center gap-2 mt-3">
            Garantía
          </CardTitle>
          <CardDescription>
            Configura las reglas para el proceso de garantías
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={control}
            name="rentals.requireGuarantee"
            render={({ field }) => (
              <FormItem className="flex mb-3 flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Requerir garantía obligatoria
                  </FormLabel>
                  <FormDescription>
                    Exigir garantía para todos los alquileres
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Cobros y Días */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base mt-2">
            Cálculo de Días y Cobros
          </CardTitle>
          <CardDescription>
            Define qué días adicionales se facturan en el alquiler
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={control}
            name="rentals.chargePickupDay"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>Cobrar día de entrega (Pickup)</FormLabel>
                  <FormDescription>
                    Si se desactiva, el primer día no se contará si es parcial
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="rentals.chargeReturnDay"
            render={({ field }) => (
              <FormItem className="flex flex-row mb-3 items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>Cobrar día de devolución (Return)</FormLabel>
                  <FormDescription>
                    Si se desactiva, el día de entrega de vuelta no se factura
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}
