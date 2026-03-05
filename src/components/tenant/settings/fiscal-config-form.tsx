// components/tenant-config/FiscalConfigForm.tsx
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Info, HelpCircle } from 'lucide-react';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import type { TenantConfig } from '@/src/types/tenant/type.tenantConfig'; 

const fiscalFormSchema = z.object({
  currency: z.string(),
  rate: z.number().min(0).max(100),
  calculationMode: z.enum(['TAX_INCLUDED', 'TAX_EXCLUDED']),
  strategy: z.enum(['HALF_UP', 'HALF_EVEN', 'FLOOR', 'CEIL']),
  applyOn: z.enum(['LINE', 'TOTAL']),
  roundTo: z.number(),
});

type FiscalFormValues = z.infer<typeof fiscalFormSchema>;

interface FiscalConfigFormProps {
  config: TenantConfig;
  onChange: (values: Partial<TenantConfig['tax']>) => void;
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

  // Actualizar cuando cambie el formulario
  useEffect(() => {
    const subscription = form.watch((values) => {
      onChange({
        rate: (values.rate || 0) / 100,
        calculationMode: values.calculationMode as 'TAX_INCLUDED' | 'TAX_EXCLUDED',
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
    { value: 'HALF_UP', label: 'HALF_UP (Redondear hacia arriba .5)', desc: 'Estándar comercial: 2.5 → 3' },
    { value: 'HALF_EVEN', label: 'HALF_EVEN (Redondeo bancario)', desc: 'Redondeo al par más cercano: 2.5 → 2' },
    { value: 'FLOOR', label: 'FLOOR (Redondear hacia abajo)', desc: 'Siempre hacia abajo: 2.9 → 2' },
    { value: 'CEIL', label: 'CEIL (Redondear hacia arriba)', desc: 'Siempre hacia arriba: 2.1 → 3' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>💰</span>
          Información Fiscal
        </CardTitle>
        <CardDescription>
          Configura los parámetros fiscales del sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-6">
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <span>🔄</span>
                Configuración de Redondeo
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p>El redondeo afecta cómo se calculan los totales y puede tener impacto contable significativo</p>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar estrategia" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roundingStrategies.map((strategy) => (
                          <SelectItem key={strategy.value} value={strategy.value}>
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
                      {roundingStrategies.find(s => s.value === field.value)?.desc}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                      onValueChange={(value) => field.onChange(parseFloat(value))} 
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar precisión" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0.01">0.01 (Centésimos)</SelectItem>
                        <SelectItem value="0.05">0.05 (Medio décimo)</SelectItem>
                        <SelectItem value="0.10">0.10 (Décimos)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}