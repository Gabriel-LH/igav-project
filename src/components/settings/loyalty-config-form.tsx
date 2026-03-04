// components/tenant-config/LoyaltyConfigForm.tsx
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { HelpCircle, Star } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import type { TenantConfig } from '@/src/types/tenant/type.tenantConfig';

const loyaltyFormSchema = z.object({
  enabled: z.boolean(),
  earnRate: z.number().min(0).max(100),
  redemptionValue: z.number().min(0),
  minPointsToRedeem: z.number().min(0),
  expirePointsAfterDays: z.number().min(0).optional(),
});

type LoyaltyFormValues = z.infer<typeof loyaltyFormSchema>;

interface LoyaltyConfigFormProps {
  config: TenantConfig;
  onChange: (values: Partial<TenantConfig['loyalty']>) => void;
}

export function LoyaltyConfigForm({ config, onChange }: LoyaltyConfigFormProps) {
  const form = useForm<LoyaltyFormValues>({
    resolver: zodResolver(loyaltyFormSchema),
    defaultValues: {
      enabled: config.loyalty.enabled,
      earnRate: config.loyalty.earnRate * 100, // Convertir a porcentaje
      redemptionValue: config.loyalty.redemptionValue,
      minPointsToRedeem: config.loyalty.minPointsToRedeem,
      expirePointsAfterDays: config.loyalty.expirePointsAfterDays,
    },
  });

  const watchEnabled = form.watch('enabled');

  useEffect(() => {
    const subscription = form.watch((values) => {
      onChange({
        enabled: values.enabled,
        earnRate: (values.earnRate || 0) / 100,
        redemptionValue: values.redemptionValue,
        minPointsToRedeem: values.minPointsToRedeem,
        expirePointsAfterDays: values.expirePointsAfterDays,
      });
    });
    return () => subscription.unsubscribe();
  }, [form, onChange]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          Programa de Lealtad
        </CardTitle>
        <CardDescription>
          Configura el sistema de puntos y recompensas para clientes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-6">
            {/* Activar programa */}
            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base flex items-center gap-2">
                      Activar programa de lealtad
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Habilita el sistema de puntos para clientes</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </FormLabel>
                    <FormDescription>
                      Los clientes podrán acumular y canjear puntos
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

            {watchEnabled && (
              <>
                <Separator />
                
                <div className="space-y-4">
                  {/* Ratio acumulación */}
                  <FormField
                    control={form.control}
                    name="earnRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Ratio de acumulación
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Porcentaje del valor de compra que se convierte en puntos</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type="number" 
                              min="0"
                              max="100"
                              step="0.1"
                              className="pr-8"
                              {...field}
                              onChange={e => field.onChange(parseFloat(e.target.value))}
                            />
                            <span className="absolute right-3 top-2.5 text-muted-foreground">%</span>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Por cada S/100, el cliente recibe {field.value} puntos
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Valor de canje */}
                  <FormField
                    control={form.control}
                    name="redemptionValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Valor de canje
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Valor en moneda de cada punto</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5">S/</span>
                            <Input 
                              type="number" 
                              min="0"
                              step="0.01"
                              className="pl-8"
                              {...field}
                              onChange={e => field.onChange(parseFloat(e.target.value))}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          1 punto = S/{field.value}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Mínimo para canjear */}
                  <FormField
                    control={form.control}
                    name="minPointsToRedeem"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Mínimo para canjear
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Puntos mínimos necesarios para realizar un canje</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0"
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Mínimo {field.value} puntos para canjear
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Expiración de puntos */}
                  <FormField
                    control={form.control}
                    name="expirePointsAfterDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Expiración de puntos
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Días después de los cuales los puntos expiran (dejar vacío para sin expiración)</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type="number" 
                              min="0"
                              className="pr-16"
                              placeholder="Sin expiración"
                              value={field.value || ''}
                              onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                            {field.value && (
                              <span className="absolute right-3 top-2.5 text-muted-foreground">días</span>
                            )}
                          </div>
                        </FormControl>
                        <FormDescription>
                          {field.value 
                            ? `Los puntos expiran después de ${field.value} días`
                            : 'Los puntos no tienen fecha de expiración'}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}