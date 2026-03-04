// components/tenant-policies/tabs/RentalsPoliciesTab.tsx
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
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { AlertCircle } from 'lucide-react';
import { ImpactIndicator } from './ui/ImpactIndicator';
import { POLICY_METADATA } from '@/src/mocks/mock.tenantPolicies';
import type { TenantPolicies } from '@/src/types/tenant/type.tenantPolicies';

export function RentalsPoliciesTab() {
  const { control, watch } = useFormContext<TenantPolicies>();
  const autoMarkAsLate = watch('rentals.autoMarkAsLate');
  const requireGuarantee = watch('rentals.requireGuarantee');
  const lateToleranceHours = watch('rentals.lateToleranceHours');

  return (
    <div className="space-y-4">
      {/* Retrasos */}
      <Card className="border-l-4 border-l-amber-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <span>⏰</span>
              Retrasos
              <ImpactIndicator 
                impact="high" 
                message={POLICY_METADATA['rentals.autoMarkAsLate']?.impactMessage}
              />
            </CardTitle>
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
                  <FormLabel className="text-base">Permitir devolución tardía</FormLabel>
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
              <FormItem className="ml-6">
                <FormLabel>Horas de tolerancia</FormLabel>
                <FormControl>
                  <div className="relative max-w-[200px]">
                    <Input 
                      type="number" 
                      min="0"
                      value={field.value}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                    <span className="absolute right-3 top-2.5 text-muted-foreground">horas</span>
                  </div>
                </FormControl>
                <FormDescription>
                  Tiempo de gracia antes de considerar atrasado
                </FormDescription>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="rentals.autoMarkAsLate"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Marcar automáticamente como atrasado</FormLabel>
                  <FormDescription className="flex items-center gap-1 text-amber-600">
                    <AlertCircle className="h-3 w-3" />
                    Los alquileres se marcarán como atrasados automáticamente
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

          {autoMarkAsLate && (
            <div className="ml-6 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-md text-sm">
              <p className="font-medium text-amber-800 dark:text-amber-300">
                ⚠️ Marcado automático activado
              </p>
              <p className="text-amber-600 dark:text-amber-400 text-xs mt-1">
                Los alquileres se marcarán como atrasados después de {lateToleranceHours} horas de tolerancia
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Garantía */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🛡️</span>
            Garantía
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={control}
            name="rentals.requireGuarantee"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Requerir garantía obligatoria</FormLabel>
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

          {requireGuarantee && (
            <FormField
              control={control}
              name="rentals.allowRentalWithoutStockAssigned"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 ml-6">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Permitir alquiler sin stock asignado</FormLabel>
                    <FormDescription>
                      Permitir alquileres incluso sin inventario disponible
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

      {/* Devolución y post-proceso */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>📦</span>
            Proceso de Devolución
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={control}
            name="rentals.autoMoveToLaundryOnReturn"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Mover automáticamente a lavandería</FormLabel>
                  <FormDescription>
                    Productos devueltos pasan directamente a lavandería
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
            name="rentals.autoMoveToMaintenanceIfDamaged"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Mover a mantenimiento si hay daño</FormLabel>
                  <FormDescription>
                    Productos dañados pasan automáticamente a mantenimiento
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