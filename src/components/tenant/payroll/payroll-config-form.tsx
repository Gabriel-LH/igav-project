"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { PayrollConfig } from "@/src/types/payroll/type.payrollConfig";

const configSchema = z
  .object({
    membershipId: z.string().min(1, "Seleccione un empleado"),
    salaryType: z.enum(["monthly", "hourly"]),
    baseSalary: z.number().optional(),
    hourlyRate: z.number().optional(),
    paySchedule: z.enum([
      "weekly",
      "biweekly",
      "semimonthly",
      "monthly",
      "manual",
    ]),
    applyOvertime: z.boolean(),
    applyhealthInsurancePercen: z.boolean(),
    applypensionPercent: z.boolean(),
    applytaxPercent: z.boolean(),
    otherDeductions: z.number(),
  })
  .superRefine((data, ctx) => {
    if (
      data.salaryType === "monthly" &&
      (!data.baseSalary || data.baseSalary <= 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["baseSalary"],
        message: "El sueldo mensual es obligatorio para tipo mensual",
      });
    }
    if (
      data.salaryType === "hourly" &&
      (!data.hourlyRate || data.hourlyRate <= 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["hourlyRate"],
        message: "La tarifa por hora es obligatoria para tipo por hora",
      });
    }
  });

interface PayrollConfigFormProps {
  config?: PayrollConfig | null;
  members: { membershipId: string; userId: string; displayName: string; email?: string }[];
  onClose: () => void;
  onSubmit: (config: any) => void;
}

export function PayrollConfigForm({
  config,
  members,
  onClose,
  onSubmit,
}: PayrollConfigFormProps) {
  const form = useForm<z.infer<typeof configSchema>>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      membershipId: "",
      salaryType: "monthly",
      baseSalary: 0,
      hourlyRate: 0,
      paySchedule: "monthly",
      applyOvertime: true,
      applyhealthInsurancePercen: true,
      applypensionPercent: true,
      applytaxPercent: true,
      otherDeductions: 0,
    },
  });

  useEffect(() => {
    if (config) {
      form.reset({
        membershipId: config.membershipId,
        salaryType: config.salaryType,
        baseSalary: config.baseSalary ?? 0,
        hourlyRate: config.hourlyRate ?? 0,
        paySchedule: config.paySchedule as any,
        applyOvertime: config.applyOvertime,
        applyhealthInsurancePercen: config.applyhealthInsurancePercent,
        applypensionPercent: config.applypensionPercent,
        applytaxPercent: config.applytaxPercent,
        otherDeductions: config.otherDeductions,
      });
    }
  }, [config, form]);

  const salaryType = useWatch({
    control: form.control,
    name: "salaryType",
  });

  const handleSubmit = (values: z.infer<typeof configSchema>) => {
    const payload = {
      id: config?.id,
      membershipId: values.membershipId,
      salaryType: values.salaryType,
      baseSalary: values.salaryType === "monthly" ? Number(values.baseSalary) : 0,
      hourlyRate: values.salaryType === "hourly" ? Number(values.hourlyRate) : 0,
      paySchedule: values.paySchedule,
      applyOvertime: values.applyOvertime,
      applyHealthInsurance: values.applyhealthInsurancePercen,
      applyPension: values.applypensionPercent,
      applyTax: values.applytaxPercent,
      otherDeductions: values.otherDeductions,
    };

    onSubmit(payload);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>
            {config
              ? "Editar configuracion salarial"
              : "Nueva configuracion salarial"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto max-h-[70vh] pr-2">
          <Form {...form}>
            <form
              id="payroll-config-form"
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="membershipId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empleado</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!!config}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar empleado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent portal={false}>
                        {members.map((option) => (
                          <SelectItem
                            key={option.membershipId}
                            value={option.membershipId}
                          >
                            {option.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="salaryType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de salario</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent portal={false}>
                          <SelectItem value="monthly">Mensual</SelectItem>
                          <SelectItem value="hourly">Por hora</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paySchedule"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frecuencia de pago</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent portal={false}>
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="biweekly">Quincenal</SelectItem>
                          <SelectItem value="semimonthly">
                            Semi-mensual
                          </SelectItem>
                          <SelectItem value="monthly">Mensual</SelectItem>
                          <SelectItem value="manual">Manual</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {salaryType === "monthly" ? (
                <FormField
                  control={form.control}
                  name="baseSalary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sueldo mensual</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          value={field.value ?? 0}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="hourlyRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tarifa por hora</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          value={field.value ?? 0}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="applyOvertime"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Aplicar horas extra
                      </FormLabel>
                      <FormDescription>
                        Multiplicador de política
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

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Deducciones Aplicables</h3>

                <FormField
                  control={form.control}
                  name="applyhealthInsurancePercen"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <FormLabel className="text-sm">Seguro de Salud</FormLabel>
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
                  name="applypensionPercent"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <FormLabel className="text-sm">Fondo de Pensiones</FormLabel>
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
                  name="applytaxPercent"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <FormLabel className="text-sm">Impuesto a la Renta</FormLabel>
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
                  name="otherDeductions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Otros descuentos fijos</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
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
            </form>
          </Form>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button form="payroll-config-form" type="submit">
            {config ? "Actualizar" : "Guardar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
