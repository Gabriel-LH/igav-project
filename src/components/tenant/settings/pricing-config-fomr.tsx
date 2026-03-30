// components/tenant-config/PricingConfigForm.tsx
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { HelpCircle } from "lucide-react";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { TenantConfig } from "@/src/types/tenant/type.tenantConfig";
import { Input } from "@/components/input";

const pricingFormSchema = z.object({
  pricePrecision: z.number().min(0).max(4),
  allowNegativeStock: z.boolean(),
  allowDiscountStacking: z.boolean(),
  maxDiscountLimit: z.number().min(0).max(100),
  requirePinForHighDiscount: z.boolean(),
  highDiscountThreshold: z.number().min(0).max(100),
});

type PricingFormValues = z.infer<typeof pricingFormSchema>;

interface PricingConfigFormProps {
  config: TenantConfig;
  onChange: (values: Partial<TenantConfig["pricing"]>) => void;
}

export function PricingConfigForm({
  config,
  onChange,
}: PricingConfigFormProps) {
  const form = useForm<PricingFormValues>({
    resolver: zodResolver(pricingFormSchema),
    defaultValues: {
      pricePrecision: config.pricing.pricePrecision,
      allowNegativeStock: config.pricing.allowNegativeStock,
      allowDiscountStacking: config.pricing.allowDiscountStacking,
      maxDiscountLimit: config.pricing.maxDiscountLimit,
      requirePinForHighDiscount: config.pricing.requirePinForHighDiscount,
      highDiscountThreshold: config.pricing.highDiscountThreshold,
    },
  });

  useEffect(() => {
    const subscription = form.watch((values) => {
      onChange({
        pricePrecision: values.pricePrecision,
        allowNegativeStock: values.allowNegativeStock,
        allowDiscountStacking: values.allowDiscountStacking,
        maxDiscountLimit: values.maxDiscountLimit,
        requirePinForHighDiscount: values.requirePinForHighDiscount,
        highDiscountThreshold: values.highDiscountThreshold,
      });
    });
    return () => subscription.unsubscribe();
  }, [form, onChange]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center mt-3">
          Configuración de Precios
        </CardTitle>
        <CardDescription>
          Define cómo se manejan los precios y el inventario
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-6">
            {/* Precisión decimal */}
            <FormField
              control={form.control}
              name="pricePrecision"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Precisión decimal
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Número de decimales para precios (2 = 0.00)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar precisión" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">0 decimales</SelectItem>
                      <SelectItem value="1">1 decimal</SelectItem>
                      <SelectItem value="2">2 decimales</SelectItem>
                      <SelectItem value="3">3 decimales</SelectItem>
                      <SelectItem value="4">4 decimales</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {field.value === 2 && "(Recomendado)"}
                    {field.value !== 2 &&
                      "Cambiar esto puede afectar cálculos existentes"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Permitir stock negativo */}
            <FormField
              control={form.control}
              name="allowNegativeStock"
              render={({ field }) => (
                <FormItem className="flex mb-3 flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base flex items-center gap-2">
                      Permitir stock negativo
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Permite ventas incluso sin stock disponible</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </FormLabel>
                    <FormDescription>
                      Activar solo si es necesario para el negocio
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
              control={form.control}
              name="allowDiscountStacking"
              render={({ field }) => (
                <FormItem className="flex mb-3 flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Permitir acumulacion de descuentos
                    </FormLabel>
                    <FormDescription>
                      Define si una promocion se puede combinar con un descuento manual.
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
              control={form.control}
              name="maxDiscountLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descuento maximo permitido (%)</FormLabel>
                  <FormDescription>
                    Tope global de descuento total.
                  </FormDescription>
                  <FormControl>
                    <div className="relative w-32">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value, 10) || 0)
                        }
                      />
                      <span className="absolute right-10 top-1.5 text-muted-foreground">
                        %
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requirePinForHighDiscount"
              render={({ field }) => (
                <FormItem className="flex mb-3 flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Pedir PIN por descuento alto
                    </FormLabel>
                    <FormDescription>
                      Solicita autorizacion cuando el descuento alcance el umbral configurado.
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
              control={form.control}
              name="highDiscountThreshold"
              render={({ field }) => (
                <FormItem className="mb-3">
                  <FormLabel>Umbral para pedir PIN (%)</FormLabel>
                  <FormDescription>
                    Desde este porcentaje se pedira PIN. Debe ser menor o igual al descuento maximo.
                  </FormDescription>
                  <FormControl>
                    <div className="relative w-32">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value, 10) || 0)
                        }
                      />
                      <span className="absolute right-10 top-1.5 text-muted-foreground">
                        %
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
