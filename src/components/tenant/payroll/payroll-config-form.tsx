// components/payroll/PayrollConfigForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import type {
  PayrollConfigView,
  PayrollEmployee,
} from "@/src/types/payroll/type.payrollView";
import { HugeiconsIcon } from "@hugeicons/react";
import { CalendarIcon, ClockIcon } from "@hugeicons/core-free-icons";

const configSchema = z
  .object({
    employeeId: z.string().min(1, "Seleccione un empleado"),
    type: z.enum(["mensual", "por_hora"]),
    baseSalary: z.number().min(0, "El salario no puede ser negativo"),
    hourlyRate: z.number().min(0).optional(),
    applyOvertime: z.boolean(),
    healthInsurance: z.boolean(),
    pension: z.boolean(),
    taxes: z.boolean(),
    otherDeductions: z.number().min(0),
  })
  .refine(
    (data) => {
      if (data.type === "por_hora" && !data.hourlyRate) {
        return false;
      }
      return true;
    },
    {
      message: "La tarifa por hora es requerida para empleados por hora",
      path: ["hourlyRate"],
    },
  );

interface PayrollConfigFormProps {
  config?: PayrollConfigView | null;
  employees: PayrollEmployee[];
  onClose: () => void;
  onSubmit: (config: PayrollConfigView) => void;
}

export function PayrollConfigForm({
  config,
  employees,
  onClose,
  onSubmit,
}: PayrollConfigFormProps) {
  const [selectedType, setSelectedType] = useState<"mensual" | "por_hora">(
    "mensual",
  );

  const form = useForm<z.infer<typeof configSchema>>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      employeeId: "",
      type: "mensual",
      baseSalary: 0,
      hourlyRate: 0,
      applyOvertime: true,
      healthInsurance: true,
      pension: true,
      taxes: true,
      otherDeductions: 0,
    },
  });

  useEffect(() => {
    if (config) {
      form.reset({
        employeeId: config.employeeId,
        type: config.type,
        baseSalary: config.baseSalary,
        hourlyRate: config.hourlyRate || 0,
        applyOvertime: config.applyOvertime,
        healthInsurance: config.automaticDeductions.healthInsurance,
        pension: config.automaticDeductions.pension,
        taxes: config.automaticDeductions.taxes,
        otherDeductions: config.automaticDeductions.otherDeductions || 0,
      });
      setSelectedType(config.type);
    }
  }, [config, form]);

  const watchType = form.watch("type");

  useEffect(() => {
    setSelectedType(watchType);
  }, [watchType]);

  const handleSubmit = (values: z.infer<typeof configSchema>) => {
    const employee = employees.find((e) => e.id === values.employeeId);

    const newConfig: PayrollConfigView = {
      id: config?.id || crypto.randomUUID(),
      employeeId: values.employeeId,
      employeeName: employee?.name || "",
      type: values.type,
      baseSalary: values.baseSalary,
      hourlyRate: values.hourlyRate,
      applyOvertime: values.applyOvertime,
      automaticDeductions: {
        healthInsurance: values.healthInsurance,
        pension: values.pension,
        taxes: values.taxes,
        otherDeductions: values.otherDeductions,
      },
      status: config?.status || "active",
      createdAt: config?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    onSubmit(newConfig);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {config
              ? "Editar configuración salarial"
              : "Nueva configuración salarial"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="employeeId"
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
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name} - {employee.membership}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Tipo de salario</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="mensual" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          <HugeiconsIcon icon={CalendarIcon} /> Mensual
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="por_hora" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          <HugeiconsIcon icon={ClockIcon} /> Por hora
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="baseSalary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {selectedType === "mensual"
                        ? "Salario mensual"
                        : "Salario base"}
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute text-sm left-3 top-2">S/.</span>
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

              {selectedType === "por_hora" && (
                <FormField
                  control={form.control}
                  name="hourlyRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tarifa por hora</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute text-sm left-3 top-2">S/.</span>
                          <Input
                            type="number"
                            step="0.5"
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
              )}
            </div>

            <FormField
              control={form.control}
              name="applyOvertime"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <FormLabel className="text-base">Aplicar horas extra</FormLabel>
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
                name="healthInsurance"
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
                name="pension"
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
                name="taxes"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <FormLabel className="text-base">Impuestos</FormLabel>
                      <FormDescription>Retención de impuestos</FormDescription>
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
                        <span className="absolute text-sm left-3 top-2">S/.</span>
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

            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">
                {config ? "Actualizar" : "Guardar"} configuración
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
