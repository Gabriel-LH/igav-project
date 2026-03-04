// components/tenant-policies/tabs/SalesPoliciesTab.tsx (versión alternativa)
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

// Componente separado para el Switch para evitar re-renders
function PolicySwitch({ control, name, label, description }: any) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
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
  const { control } = useFormContext<TenantPolicies>();
  const allowReturns = useWatch({
    control,
    name: "sales.allowReturns",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>💰</span>
          Políticas de Ventas
        </CardTitle>
        <CardDescription>
          Configura las reglas para el proceso de ventas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Devoluciones */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <span>🔄</span>
            Devoluciones
          </h3>

          <PolicySwitch
            control={control}
            name="sales.allowReturns"
            label="Permitir devoluciones"
            description="Habilita la opción de devolver productos"
          />

          {allowReturns && (
            <FormField
              control={control}
              name="sales.maxReturnDays"
              render={({ field }) => (
                <FormItem className="ml-6">
                  <FormLabel className="flex items-center gap-2">
                    Días máximos para devolver
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Plazo máximo después de la compra para aceptar
                            devoluciones
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
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (!isNaN(value)) {
                            field.onChange(value);
                          }
                        }}
                      />
                      <span className="absolute right-3 top-2.5 text-muted-foreground">
                        días
                      </span>
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
          )}
        </div>

        <Separator />

        {/* Precios y cancelaciones */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <span>🏷️</span>
            Precios y Cancelaciones
          </h3>

          <PolicySwitch
            control={control}
            name="sales.allowPriceEdit"
            label="Permitir editar precio"
            description="Habilitar modificación manual de precios en ventas"
          />

          <PolicySwitch
            control={control}
            name="sales.requireReasonForCancel"
            label="Requerir motivo de cancelación"
            description="Obligar a ingresar motivo al cancelar una venta"
          />

          <PolicySwitch
            control={control}
            name="sales.autoCompleteDelivery"
            label="Completar entrega automáticamente"
            description="Marcar entregas como completadas sin confirmación manual"
          />
        </div>
      </CardContent>
    </Card>
  );
}
