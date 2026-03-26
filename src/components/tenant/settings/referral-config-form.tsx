"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEFAULT_TENANT_CONFIG } from "@/src/lib/tenant-defaults";
import type { TenantConfig } from "@/src/types/tenant/type.tenantConfig";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/tooltip";
import { HelpCircle } from "lucide-react";
import { Separator } from "@/components/separator";

const referralConfigSchema = z.object({
  enabled: z.boolean(),
  rewardType: z.enum(["discount_coupon", "loyalty_points"]),
  rewardValue: z.number().min(0),
  couponDiscountType: z.enum(["percentage", "fixed_amount"]),
  couponExpiresInDays: z.number().min(1).optional(),
  triggerCondition: z.enum(["first_purchase", "first_payment"]),
});

type ReferralConfigValues = z.infer<typeof referralConfigSchema>;

export function ReferralConfigForm({
  config,
  onChange,
}: {
  config: TenantConfig;
  onChange: (values: Partial<TenantConfig["referrals"]>) => void;
}) {
  const referralConfig = config.referrals ?? DEFAULT_TENANT_CONFIG.referrals;

  const form = useForm<ReferralConfigValues>({
    resolver: zodResolver(referralConfigSchema),
    defaultValues: {
      enabled: referralConfig.enabled,
      rewardType: referralConfig.rewardType,
      rewardValue: referralConfig.rewardValue,
      couponDiscountType: referralConfig.couponDiscountType,
      couponExpiresInDays: referralConfig.couponExpiresInDays,
      triggerCondition: referralConfig.triggerCondition,
    },
  });

  const enabled = form.watch("enabled");
  const rewardType = form.watch("rewardType");

  useEffect(() => {
    const subscription = form.watch((values) => {
      onChange({
        enabled: values.enabled,
        rewardType: values.rewardType,
        rewardValue: values.rewardValue,
        couponDiscountType: values.couponDiscountType,
        couponExpiresInDays: values.couponExpiresInDays,
        triggerCondition: values.triggerCondition,
      });
    });

    return () => subscription.unsubscribe();
  }, [form, onChange]);

  return (
    <Card>
      <CardHeader className="mt-3">
        <CardTitle>Programa de referidos</CardTitle>
        <CardDescription>
          Define si el cliente que refiere gana puntos o un cupon, y el valor de
          esa recompensa.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-4">
            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex mb-3 items-center justify-between rounded-lg border p-4">
                  <div>
                    <FormLabel>
                      Programa de referidos
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Habilita el programa de referidos</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </FormLabel>
                    <FormDescription>
                      Los clientes podrán acumular puntos o cupones por referir
                      a otros clientes.
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

            {enabled && (
              <>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="triggerCondition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Se dispara cuando</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="first_purchase">
                              Primera compra
                            </SelectItem>
                            <SelectItem value="first_payment">
                              Primer pago
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rewardType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de recompensa</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="loyalty_points">
                              Puntos
                            </SelectItem>
                            <SelectItem value="discount_coupon">
                              Cupon
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="rewardValue"
                  render={({ field }) => (
                    <FormItem className="mb-3">
                      <FormLabel>
                        {rewardType === "loyalty_points"
                          ? "Cantidad de puntos"
                          : "Valor del cupon"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={field.value ?? 0}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? 0
                                : Number(e.target.value),
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {rewardType === "discount_coupon" && (
                  <>
                    <FormField
                      control={form.control}
                      name="couponDiscountType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de descuento del cupon</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="percentage">
                                Porcentaje
                              </SelectItem>
                              <SelectItem value="fixed_amount">
                                Monto fijo
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="couponExpiresInDays"
                      render={({ field }) => (
                        <FormItem className="mb-3">
                          <FormLabel>Expira en dias</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder="Opcional"
                              value={field.value ?? ""}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    ? Number(e.target.value)
                                    : undefined,
                                )
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
