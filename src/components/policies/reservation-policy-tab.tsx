// components/tenant-policies/tabs/ReservationsPoliciesTab.tsx
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
import { Separator } from "@/components/ui/separator";
import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { TenantPolicies } from "@/src/types/tenant/type.tenantPolicies";

export function ReservationsPoliciesTab() {
  const { control, watch } = useFormContext<TenantPolicies>();
  const autoExpire = watch("reservations.autoExpireReservations");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>📅</span>
          Políticas de Reservas
        </CardTitle>
        <CardDescription>
          Configura el comportamiento de las reservas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Expiración */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <span>⏳</span>
            Expiración
          </h3>

          <FormField
            control={control}
            name="reservations.autoExpireReservations"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Expirar reservas automáticamente
                  </FormLabel>
                  <FormDescription>
                    Las reservas no confirmadas expiran después del tiempo
                    configurado
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

          {autoExpire && (
            <FormField
              control={control}
              name="reservations.expireAfterHours"
              render={({ field }) => (
                <FormItem className="ml-6">
                  <FormLabel className="flex items-center gap-2">
                    Horas antes de expirar
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Tiempo máximo que una reserva puede estar pendiente
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </FormLabel>
                  <FormControl>
                    <div className="relative max-w-[200px]">
                      <Input
                        type="number"
                        min="1"
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value))
                        }
                      />
                      <span className="absolute right-3 top-2.5 text-muted-foreground">
                        horas
                      </span>
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
          )}
        </div>

        <Separator />

        {/* Configuración avanzada */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <span>⚙️</span>
            Configuración avanzada
          </h3>

          <FormField
            control={control}
            name="reservations.allowOverbooking"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Permitir sobreventa
                  </FormLabel>
                  <FormDescription>
                    Permitir reservas por encima del stock disponible
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
            name="reservations.requireDeposit"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Requerir depósito</FormLabel>
                  <FormDescription>
                    Exigir pago anticipado para confirmar reservas
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
            name="reservations.autoConvertOnPickup"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Convertir automáticamente al recoger
                  </FormLabel>
                  <FormDescription>
                    La reserva se convierte en venta/alquiler al momento de
                    recoger
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
      </CardContent>
    </Card>
  );
}
