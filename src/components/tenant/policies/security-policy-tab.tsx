// components/tenant-policies/tabs/SecurityPoliciesTab.tsx
'use client';

import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
  FormControl,
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Shield } from 'lucide-react';
import type { TenantPolicies } from '@/src/types/tenant/type.tenantPolicies';

export function SecurityPoliciesTab() {
  const { control } = useFormContext<TenantPolicies>();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Políticas de Seguridad
        </CardTitle>
        <CardDescription>
          Configura los requisitos de autorización para operaciones sensibles
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            Requerir PIN para:
          </h3>

          <FormField
            control={control}
            name="security.requirePinForHighDiscount"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Descuento alto</FormLabel>
                  <FormDescription>
                    Solicitar PIN para descuentos que excedan el límite
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
            name="security.requirePinForCancelOperation"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Cancelación de operación</FormLabel>
                  <FormDescription>
                    Solicitar PIN para cancelar ventas o alquileres
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
                  <FormLabel className="text-base">Edición manual de precio</FormLabel>
                  <FormDescription>
                    Solicitar PIN para modificar precios manualmente
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

        <Separator />

        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-300 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Estas políticas ayudan a prevenir operaciones no autorizadas
          </p>
        </div>
      </CardContent>
    </Card>
  );
}