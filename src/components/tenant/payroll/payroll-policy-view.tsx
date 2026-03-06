"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PayrollPolicy } from "@/src/types/payroll/type.payrollPolicies";

const payrollPolicyFormSchema = z.object({
  healthInsurancePercent: z.number().min(0).max(100),
  pensionPercent: z.number().min(0).max(100),
  taxPercent: z.number().min(0).max(100),
  overtimeMultiplier: z.number().min(1),
});

type PayrollPolicyFormValues = z.infer<typeof payrollPolicyFormSchema>;

interface PayrollPolicyViewProps {
  policy: PayrollPolicy;
  onPolicyChange: (nextPolicy: PayrollPolicy) => void;
}

export function PayrollPolicyView({ policy, onPolicyChange }: PayrollPolicyViewProps) {
  const defaultValues = useMemo(
    () => ({
      healthInsurancePercent: policy.deductions.healthInsurancePercent,
      pensionPercent: policy.deductions.pensionPercent,
      taxPercent: policy.deductions.taxPercent,
      overtimeMultiplier: policy.overtimeMultiplier,
    }),
    [policy],
  );

  const form = useForm<PayrollPolicyFormValues>({
    resolver: zodResolver(payrollPolicyFormSchema),
    values: defaultValues,
  });

  const onSubmit = (values: PayrollPolicyFormValues) => {
    onPolicyChange({
      ...policy,
      deductions: {
        healthInsurancePercent: values.healthInsurancePercent,
        pensionPercent: values.pensionPercent,
        taxPercent: values.taxPercent,
      },
      overtimeMultiplier: values.overtimeMultiplier,
      updatedAt: new Date(),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Política de Nómina</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="healthInsurancePercent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Seguro de salud (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pensionPercent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pensión (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="taxPercent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Impuesto (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="overtimeMultiplier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Multiplicador hora extra</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="md:col-span-2 flex justify-end">
              <Button type="submit">Guardar Política</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
