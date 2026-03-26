// components/tenant-config/DiscountsConfigForm.tsx
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { HelpCircle } from 'lucide-react';
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
import type { TenantConfig } from '@/src/types/tenant/type.tenantConfig';

const discountsFormSchema = z.object({
  maxPercentageAllowed: z.number().min(0).max(100),
  requireAdminAuthOver: z.number().min(0).max(100),
  allowStacking: z.boolean(),
});

type DiscountsFormValues = z.infer<typeof discountsFormSchema>;

interface DiscountsConfigFormProps {
  config: TenantConfig;
  onChange: (values: Partial<TenantConfig['discounts']>) => void;
}

export function DiscountsConfigForm({ config, onChange }: DiscountsConfigFormProps) {
  const form = useForm<DiscountsFormValues>({
    resolver: zodResolver(discountsFormSchema),
    defaultValues: {
      maxPercentageAllowed: config.discounts.maxPercentageAllowed,
      requireAdminAuthOver: config.discounts.requireAdminAuthOver,
      allowStacking: config.discounts.allowStacking,
    },
  });

  useEffect(() => {
    const subscription = form.watch((values) => {
      onChange({
        maxPercentageAllowed: values.maxPercentageAllowed,
        requireAdminAuthOver: values.requireAdminAuthOver,
        allowStacking: values.allowStacking,
      });
    });
    return () => subscription.unsubscribe();
  }, [form, onChange]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center mt-3">
          Descuentos Globales
        </CardTitle>
        <CardDescription>
          Configura las políticas de descuento del sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-6">
            {/* Máximo % permitido */}
            <FormField
              control={form.control}
              name="maxPercentageAllowed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Máximo % permitido
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Porcentaje máximo de descuento que se puede aplicar</p>
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
                        className="pr-8"
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value))}
                      />
                      <span className="absolute right-3 top-1.5 text-muted-foreground">%</span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* % que requiere autorización */}
            <FormField
              control={form.control}
              name="requireAdminAuthOver"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    % que requiere autorización
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Descuentos mayores a este porcentaje necesitan aprobación</p>
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
                        className="pr-8"
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value))}
                      />
                      <span className="absolute right-3 top-1.5 text-muted-foreground">%</span>
                    </div>
                  </FormControl>
                  <FormDescription>
                    {field.value < form.getValues('maxPercentageAllowed') 
                      ? `Descuentos entre ${field.value}% y ${form.getValues('maxPercentageAllowed')}% requieren autorización`
                      : 'Todos los descuentos requieren autorización'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Permitir acumulación */}
            <FormField
              control={form.control}
              name="allowStacking"
              render={({ field }) => (
                <FormItem className="flex mb-3 flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base flex items-center gap-2">
                      Permitir acumulación
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Permite aplicar múltiples descuentos sobre un mismo producto</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </FormLabel>
                    <FormDescription>
                      Si se activa, los descuentos pueden combinarse
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
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}