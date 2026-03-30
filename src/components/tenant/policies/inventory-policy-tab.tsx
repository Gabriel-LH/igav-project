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
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import type { TenantPolicy } from "@/src/types/tenant/type.tenantPolicy";

export function InventoryPoliciesTab() {
  const { control, watch } = useFormContext<TenantPolicy>();
  const allowManualAdjustments = watch("inventory.allowManualAdjustments");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="mt-3 flex items-center gap-2">
          Politicas de Inventario
        </CardTitle>
        <CardDescription>
          Aqui solo quedan reglas operativas de inventario que no dependen de la
          configuracion general. El stock negativo se configura en Ajustes {">"}{" "}
          Precios y el bloqueo por reserva ya lo resuelve el flujo de reservas.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
          Se removieron los switches duplicados de stock negativo y bloqueo por
          reserva para evitar configuraciones contradictorias.
        </div>

        <FormField
          control={control}
          name="inventory.allowManualAdjustments"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  Permitir ajustes manuales
                </FormLabel>
                <FormDescription>
                  Habilita correcciones manuales sobre el inventario.
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

        {allowManualAdjustments && (
          <FormField
            control={control}
            name="inventory.requireReasonForAdjustment"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Requerir motivo en ajustes
                  </FormLabel>
                  <FormDescription>
                    Obliga a registrar la razon de cada ajuste manual.
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
        )}
      </CardContent>
    </Card>
  );
}
