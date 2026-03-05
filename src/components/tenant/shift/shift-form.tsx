// components/shifts/ShiftForm.tsx
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type {
  Shift,
  WorkingDay,
} from "@/src/application/interfaces/shift/shift";

const shiftSchema = z
  .object({
    name: z.string().min(1, "El nombre es requerido"),
    startTime: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato HH:MM requerido"),
    endTime: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato HH:MM requerido"),
    toleranceMinutes: z.number().min(0, "La tolerancia no puede ser negativa"),
    allowOvertime: z.boolean(),
    status: z.enum(["active", "inactive"]),
  })
  .refine(
    (data) => {
      // Validación simple de horario (considerando turnos nocturnos)
      return data.startTime !== data.endTime;
    },
    {
      message: "La hora de inicio y fin no pueden ser iguales",
      path: ["endTime"],
    },
  );

interface ShiftFormProps {
  shift?: Shift | null;
  onClose: () => void;
  onSubmit: (shift: Shift) => void;
}

const DAYS: WorkingDay[] = [
  { day: "L", label: "Lunes", active: false },
  { day: "M", label: "Martes", active: false },
  { day: "X", label: "Miércoles", active: false },
  { day: "J", label: "Jueves", active: false },
  { day: "V", label: "Viernes", active: false },
  { day: "S", label: "Sábado", active: false },
  { day: "D", label: "Domingo", active: false },
];

export function ShiftForm({ shift, onClose, onSubmit }: ShiftFormProps) {
  const [workingDays, setWorkingDays] = useState<WorkingDay[]>(DAYS);
  const [validationError, setValidationError] = useState<string>("");

  const form = useForm<z.infer<typeof shiftSchema>>({
    resolver: zodResolver(shiftSchema),
    defaultValues: {
      name: "",
      startTime: "09:00",
      endTime: "18:00",
      toleranceMinutes: 15,
      allowOvertime: false,
      status: "active",
    },
  });

  useEffect(() => {
    if (shift) {
      form.reset({
        name: shift.name,
        startTime: shift.startTime,
        endTime: shift.endTime,
        toleranceMinutes: shift.toleranceMinutes,
        allowOvertime: shift.allowOvertime,
        status: shift.status,
      });
      setWorkingDays(shift.workingDays);
    }
  }, [shift, form]);

  const handleSubmit = (values: z.infer<typeof shiftSchema>) => {
    // Validar que al menos un día esté seleccionado
    if (!workingDays.some((day) => day.active)) {
      setValidationError("Debe seleccionar al menos un día laboral");
      return;
    }

    setValidationError("");

    const newShift: Shift = {
      id: shift?.id || crypto.randomUUID(),
      ...values,
      workingDays,
      createdAt: shift?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    onSubmit(newShift);
  };

  const toggleDay = (index: number) => {
    setWorkingDays((prev) =>
      prev.map((day, i) =>
        i === index ? { ...day, active: !day.active } : day,
      ),
    );
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {shift ? "Editar turno" : "Crear nuevo turno"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del turno</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Turno mañana" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora de inicio</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora de fin</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <FormLabel>Días laborales</FormLabel>
              <div className="grid grid-cols-7 gap-2 mt-2">
                {workingDays.map((day, index) => (
                  <div
                    key={day.day}
                    className="flex flex-col items-center space-y-2"
                  >
                    <Checkbox
                      id={`day-${day.day}`}
                      checked={day.active}
                      onCheckedChange={() => toggleDay(index)}
                    />
                    <label
                      htmlFor={`day-${day.day}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {day.day}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <FormField
              control={form.control}
              name="toleranceMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minutos de tolerancia</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      value={field.value}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allowOvertime"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Permitir horas extra
                    </FormLabel>
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
              name="status"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Estado activo</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value === "active"}
                      onCheckedChange={(checked) =>
                        field.onChange(checked ? "active" : "inactive")
                      }
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {validationError && (
              <Alert variant="destructive">
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">
                {shift ? "Actualizar" : "Crear"} turno
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
