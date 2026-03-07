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
import { PAYROLL_MEMBER_OPTIONS } from "@/src/application/interfaces/payroll/PayrollPresentation";
import { Separator } from "@/components/separator";

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
  onClose: () => void;
  onSubmit: (config: PayrollConfig) => void;
}

export function PayrollConfigForm({
  config,
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
    },
  });

  useEffect(() => {
    if (config) {
      form.reset({
        membershipId: config.membershipId,
        salaryType: config.salaryType,
        baseSalary: config.baseSalary ?? 0,
        hourlyRate: config.hourlyRate ?? 0,
        paySchedule: config.paySchedule,
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
    const next: PayrollConfig = {
      id: config?.id ?? crypto.randomUUID(),
      membershipId: values.membershipId,
      salaryType: values.salaryType,
      baseSalary:
        values.salaryType === "monthly"
          ? Number(values.baseSalary ?? 0)
          : undefined,
      hourlyRate:
        values.salaryType === "hourly"
          ? Number(values.hourlyRate ?? 0)
          : undefined,
      paySchedule: values.paySchedule,
      applyOvertime: values.applyOvertime,
      applyhealthInsurancePercent: values.applyhealthInsurancePercen,
      applypensionPercent: values.applypensionPercent,
      applytaxPercent: values.applytaxPercent,
      otherDeductions: values.otherDeductions,
      createdAt: config?.createdAt ?? new Date(),
      updatedAt: new Date(),
    };

    onSubmit(next);
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
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar empleado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PAYROLL_MEMBER_OPTIONS.map((option) => (
                          <SelectItem
                            key={option.membershipId}
                            value={option.membershipId}
                          >
                            {option.displayName} - {option.membershipId}
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
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
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
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
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
                    <div>
                      <FormLabel className="text-base">
                        Aplicar horas extra
                      </FormLabel>
                      <FormDescription>
                        Usa el multiplicador definido en Política de Nómina
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

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Descuentos automáticos</h3>

                <FormField
                  control={form.control}
                  name="applyhealthInsurancePercen"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <FormLabel className="text-base">
                          Seguro de salud
                        </FormLabel>
                        <FormDescription>
                          Descuento por seguro médico
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
                  name="applypensionPercent"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <FormLabel className="text-base">
                          Fondo de pensiones
                        </FormLabel>
                        <FormDescription>
                          Aporte al sistema de pensiones
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
                  name="applytaxPercent"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <FormLabel className="text-base">Impuestos</FormLabel>
                        <FormDescription>
                          Retención de impuestos
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
                  name="otherDeductions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Otros descuentos</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute text-sm left-3 top-2">
                            S/.
                          </span>
                          <Input
                            type="number"
                            className="pl-8"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value))
                            }
                          />
                        </div>
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
          <Button type="submit">{config ? "Actualizar" : "Guardar"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
