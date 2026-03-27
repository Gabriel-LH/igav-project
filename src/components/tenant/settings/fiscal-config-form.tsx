// components/tenant-config/FiscalConfigForm.tsx
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info, HelpCircle, InfoIcon } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import type { TenantConfig } from "@/src/types/tenant/type.tenantConfig";
import { Label } from "@/components/label";

const fiscalFormSchema = z.object({
  currency: z.string(),
  rate: z.number().min(0).max(100),
  calculationMode: z.enum(["TAX_INCLUDED", "TAX_EXCLUDED"]),
  strategy: z.enum(["HALF_UP", "HALF_EVEN", "FLOOR", "CEIL"]),
  applyOn: z.enum(["LINE", "TOTAL"]),
  roundTo: z.number(),
});

type FiscalFormValues = z.infer<typeof fiscalFormSchema>;

interface FiscalConfigFormProps {
  config: TenantConfig;
  onChange: (values: Partial<TenantConfig["tax"]>) => void;
}

export function FiscalConfigForm({ config, onChange }: FiscalConfigFormProps) {
  const form = useForm<FiscalFormValues>({
    resolver: zodResolver(fiscalFormSchema),
    defaultValues: {
      currency: config.currency,
      rate: config.tax.rate * 100, // Convertir a porcentaje para mostrar
      calculationMode: config.tax.calculationMode,
      strategy: config.tax.rounding.strategy,
      applyOn: config.tax.rounding.applyOn,
      roundTo: config.tax.rounding.roundTo,
    },
  });

  const [testAmount, setTestAmount] = useState<number>(0);

  const calculatePreview = (
    amount: number,
    roundTo: number,
    strategy: string,
  ) => {
    const factor = amount / roundTo;
    let rounded;

    switch (strategy) {
      case "FLOOR":
        rounded = Math.floor(factor);
        break;
      case "CEIL":
        rounded = Math.ceil(factor);
        break;
      case "HALF_UP":
        rounded = Math.round(factor);
        break;
      case "HALF_EVEN":
        // Lógica de redondeo bancario (al par más cercano)
        const i = Math.floor(factor);
        const f = factor - i;
        if (f !== 0.5) rounded = Math.round(factor);
        else rounded = i % 2 === 0 ? i : i + 1;
        break;
      default:
        rounded = Math.round(factor);
    }
    return (rounded * roundTo).toFixed(2);
  };

  // Actualizar cuando cambie el formulario
  useEffect(() => {
    const subscription = form.watch((values) => {
      onChange({
        rate: (values.rate || 0) / 100,
        calculationMode: values.calculationMode as
          | "TAX_INCLUDED"
          | "TAX_EXCLUDED",
        rounding: {
          strategy: values.strategy as any,
          applyOn: values.applyOn as any,
          roundTo: values.roundTo || 0.01,
        },
      });
    });
    return () => subscription.unsubscribe();
  }, [form, onChange]);

  const roundingStrategies = [
    {
      value: "HALF_UP",
      label: "Aritmético (Estándar)",
      desc: "Redondea al más cercano. Si está a la mitad (.5), sube. Ejemplo: 45.95 → 46.00",
    },
    {
      value: "HALF_EVEN",
      label: "Bancario (Par más cercano)",
      desc: "Reduce el error acumulado en grandes volúmenes. Ejemplo: 2.5 → 2, 3.5 → 4",
    },
    {
      value: "FLOOR",
      label: "A favor del Cliente (Hacia abajo)",
      desc: "Ignora el exceso decimal. Obligatorio en pagos en efectivo. Ejemplo: 45.99 → 45.90",
    },
    {
      value: "CEIL",
      label: "A favor de la Empresa (Hacia arriba)",
      desc: "Cualquier decimal sube al siguiente nivel. Ejemplo: 45.91 → 46.00",
    },
  ];

  return (
    <Card className="drop-shadow-2xl">
      <CardHeader className="mt-3">
        <CardTitle className="flex items-center gap-2">
          Información Fiscal
        </CardTitle>
        <CardDescription>
          Configura los parámetros fiscales del sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-6">
            <div className="w-full md:grid-cols-2 grid gap-4 items-center">
              {/* Moneda */}
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Moneda
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Moneda oficial para transacciones</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar moneda" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PEN">PEN (Soles)</SelectItem>
                        <SelectItem value="USD">USD (Dólares)</SelectItem>
                        <SelectItem value="EUR">EUR (Euros)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tasa IGV */}
              <FormField
                control={form.control}
                name="rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Tasa de IGV (%)
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Porcentaje de Impuesto General a las Ventas</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Modo de cálculo */}
            <FormField
              control={form.control}
              name="calculationMode"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="flex items-center gap-2">
                    Modo de cálculo
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Define cómo se maneja el IGV en los precios</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="TAX_INCLUDED" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Precio incluye IGV
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="TAX_EXCLUDED" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Precio no incluye IGV
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Configuración de redondeo */}
            <div className="space-y-4 mb-3">
              <h3 className="font-medium flex items-center gap-2">
                Configuración de Redondeo
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p>
                        El redondeo afecta cómo se calculan los totales y puede
                        tener impacto contable significativo
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </h3>

              {/* Estrategia de redondeo */}
              <FormField
                control={form.control}
                name="strategy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estrategia de redondeo</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar estrategia" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roundingStrategies.map((strategy) => (
                          <SelectItem
                            key={strategy.value}
                            value={strategy.value}
                          >
                            <div>
                              <span>{strategy.label}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                {strategy.desc}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {
                        roundingStrategies.find((s) => s.value === field.value)
                          ?.desc
                      }
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  {/* Aplicar redondeo */}
                  <FormField
                    control={form.control}
                    name="applyOn"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Aplicar redondeo</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex space-x-4"
                          >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="LINE" />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                Por línea
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="TOTAL" />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                Al total
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Redondear a */}
                  <FormField
                    control={form.control}
                    name="roundTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Redondear a</FormLabel>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(parseFloat(value))
                          }
                          defaultValue={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar precisión" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="0.01">
                              0.01 (Centésimos)
                            </SelectItem>
                            <SelectItem value="0.05">
                              0.05 (Medio décimo)
                            </SelectItem>
                            <SelectItem value="0.10">0.10 (Décimos)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Sección de Simulador */}
                <div className="mt-6 p-4 border rounded-lg">
                  <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                    Simulador en tiempo real
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoIcon size={14} />
                      </TooltipTrigger>
                      <TooltipContent>
                        Prueba cómo se comportará el redondeo con un monto real
                        antes de guardar.
                      </TooltipContent>
                    </Tooltip>
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Monto de prueba</Label>
                      <Input
                        type="number"
                        defaultValue="45.99"
                        onChange={(e) =>
                          setTestAmount(parseFloat(e.target.value))
                        }
                      />
                    </div>
                    <div className="flex flex-col justify-end">
                      <span className="text-xs text-muted-foreground">
                        Resultado final:
                      </span>
                      <span className="text-xl font-mono font-bold text-primary">
                        {calculatePreview(
                          testAmount,
                          form.watch("roundTo"),
                          form.watch("strategy"),
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
