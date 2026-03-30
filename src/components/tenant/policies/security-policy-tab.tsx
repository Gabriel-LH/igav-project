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
import { Shield } from "lucide-react";
import type { TenantPolicy } from "@/src/types/tenant/type.tenantPolicy";
import { UserPinForm } from "@/src/components/tenant/settings/user-pin-form";

export function SecurityPoliciesTab() {
  const { control } = useFormContext<TenantPolicy>();

  return (
    <Card>
      <CardHeader className="-mb-4">
        <CardTitle className="mt-3 flex items-center gap-2">
          Politicas de Seguridad
        </CardTitle>
        <CardDescription>
          Aqui defines autorizaciones sensibles que no dependen del modulo de
          descuentos. El PIN por descuento alto se configura en Ajustes {">"}{" "}
          Precios.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
          Usa este bloque para configurar el PIN personal y decidir en que
          operaciones sensibles sera obligatorio.
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Gestion de Mi PIN</h3>
          <UserPinForm />
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Requerir PIN para:</h3>

          <FormField
            control={control}
            name="security.requirePinForCancelOperation"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Cancelacion de operacion
                  </FormLabel>
                  <FormDescription>
                    Solicitar PIN para cancelar ventas o alquileres.
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
            name="security.requirePinForManualPriceEdit"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Edicion manual de precio
                  </FormLabel>
                  <FormDescription>
                    Solicitar PIN para modificar precios manualmente.
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
        </div>

        <div className="mb-3 rounded-lg bg-blue-50 p-4 dark:bg-blue-950/20">
          <p className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-300">
            <Shield className="h-4 w-4" />
            Estas politicas ayudan a prevenir operaciones no autorizadas.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
