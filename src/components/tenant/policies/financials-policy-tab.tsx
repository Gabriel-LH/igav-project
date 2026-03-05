// components/tenant-policies/tabs/FinancialPoliciesTab.tsx
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
import { AlertCircle } from "lucide-react";
import { ImpactIndicator } from "./ui/ImpactIndicator";
import { POLICY_METADATA } from "@/src/mocks/mock.tenantPolicies";
import type { TenantPolicies } from "@/src/types/tenant/type.tenantPolicies";

export function FinancialPoliciesTab() {
  const { control, watch } = useFormContext<TenantPolicies>();
  const autoApplyCharges = watch("financial.autoApplyChargesOnDamage");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>💵</span>
          Políticas Financieras
        </CardTitle>
        <CardDescription>
          Configura las reglas financieras del sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={control}
          name="financial.allowNegativeBalance"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  Permitir saldo negativo
                </FormLabel>
                <FormDescription>
                  Los clientes pueden tener saldo deudor
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
          name="financial.autoApplyChargesOnDamage"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <FormLabel className="text-base">
                    Aplicar cargos automáticos por daño
                  </FormLabel>
                  <ImpactIndicator
                    impact="high"
                    message={
                      POLICY_METADATA["financial.autoApplyChargesOnDamage"]
                        ?.impactMessage
                    }
                  />
                </div>
                <FormDescription className="flex items-center gap-1 text-amber-600">
                  <AlertCircle className="h-3 w-3" />
                  Se generarán cargos automáticos al reportar daños
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

        {autoApplyCharges && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-md text-sm">
            <p className="font-medium text-amber-800 dark:text-amber-300">
              ⚠️ Cargos automáticos activados
            </p>
            <p className="text-amber-600 dark:text-amber-400 text-xs mt-1">
              Los daños reportados generarán cargos automáticos según la tarifa
              del producto
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
