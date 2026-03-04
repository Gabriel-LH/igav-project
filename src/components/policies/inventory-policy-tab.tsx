// components/tenant-policies/tabs/InventoryPoliciesTab.tsx
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
import { Switch } from "@/components/ui/switch";
import { ImpactIndicator } from "./ui/ImpactIndicator";
import { POLICY_METADATA } from "@/src/mocks/mock.tenantPolicies";
import type { TenantPolicies } from "@/src/types/tenant/type.tenantPolicies";

export function InventoryPoliciesTab() {
  const { control, watch } = useFormContext<TenantPolicies>();
  const allowManualAdjustments = watch("inventory.allowManualAdjustments");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>📊</span>
          Políticas de Inventario
        </CardTitle>
        <CardDescription>
          Configura el comportamiento del inventario
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
                  Habilitar modificaciones manuales del inventario
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
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 ml-6">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Requerir motivo en ajustes
                  </FormLabel>
                  <FormDescription>
                    Obligar a ingresar razón para cada ajuste
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

        <FormField
          control={control}
          name="inventory.autoBlockStockIfReserved"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <FormLabel className="text-base">
                    Bloquear stock si está reservado
                  </FormLabel>
                  <ImpactIndicator
                    impact="high"
                    message={
                      POLICY_METADATA["inventory.autoBlockStockIfReserved"]
                        ?.impactMessage
                    }
                  />
                </div>
                <FormDescription>
                  El stock reservado no estará disponible para otras
                  transacciones
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
  );
}
