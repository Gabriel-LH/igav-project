"use client";

import { useFormContext, useWatch } from "react-hook-form";
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
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import type { TenantPolicy } from "@/src/types/tenant/type.tenantPolicy";

function PolicySwitch({ control, name, label, description }: any) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="mb-3 flex flex-row items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <FormLabel className="text-base">{label}</FormLabel>
            <FormDescription>{description}</FormDescription>
          </div>
          <FormControl>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </FormControl>
        </FormItem>
      )}
    />
  );
}

export function SalesPoliciesTab() {
  const { control } = useFormContext<TenantPolicy>();
  const allowReturns = useWatch({
    control,
    name: "sales.allowReturns",
  });

  return (
    <Card>
      <CardHeader className="-mb-4">
        <CardTitle className="mt-3 flex items-center gap-2">
          Politicas de Ventas
        </CardTitle>
        <CardDescription>
          Configura las reglas operativas del flujo de ventas. Los descuentos se
          configuran en Ajustes {">"} Precios.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="flex items-center gap-2 text-lg font-medium">
            Devoluciones
          </h3>

          <PolicySwitch
            control={control}
            name="sales.allowReturns"
            label="Permitir devoluciones"
            description="Habilita la opcion de devolver productos."
          />

          {allowReturns && (
            <FormField
              control={control}
              name="sales.maxReturnHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Horas máximas para devolución
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Plazo máximo en horas después de la compra.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </FormLabel>
                  <FormControl>
                    <div className="relative w-fit flex items-center">
                      <Input
                        type="number"
                        min="0"
                        className="pr-16"
                        value={field.value}
                        onChange={(e) => {
                          const value = parseInt(e.target.value, 10);
                          field.onChange(isNaN(value) ? 0 : value);
                        }}
                      />
                      <span className="absolute right-3 text-muted-foreground text-sm pointer-events-none">
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

        <div className="space-y-4">
          <h3 className="flex items-center gap-2 text-lg font-medium">
            Precios y Cancelaciones
          </h3>

          <PolicySwitch
            control={control}
            name="sales.allowPriceEdit"
            label="Permitir cambios de precio en el Carrito"
            description="Si se desactiva, el cajero sólo puede usar promociones automáticas y no podrá sobreescribir precios."
          />

          <PolicySwitch
            control={control}
            name="sales.requireReasonForCancel"
            label="Requerir motivo de cancelacion"
            description="Obligar a ingresar motivo al cancelar una venta."
          />

          <FormField
            control={control}
            name="sales.maxCancelHours"
            render={({ field }) => (
              <FormItem className="mb-3">
                <FormLabel className="flex items-center gap-2">
                  Horas máximas para anulación
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Plazo máximo en horas permitido para anular una venta.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </FormLabel>
                <FormControl>
                  <div className="relative w-fit flex items-center">
                    <Input
                      type="number"
                      min="0"
                      className="pr-16"
                      value={field.value}
                      onChange={(e) => {
                        const value = parseInt(e.target.value, 10);
                        field.onChange(isNaN(value) ? 0 : value);
                      }}
                    />
                    <span className="absolute right-3 text-muted-foreground text-sm pointer-events-none">
                      horas
                    </span>
                  </div>
                </FormControl>
              </FormItem>
            )}
          />


        </div>
      </CardContent>
    </Card>
  );
}
