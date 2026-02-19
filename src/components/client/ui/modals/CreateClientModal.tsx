"use client";

import React, { useState } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/label";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCustomerStore } from "@/src/store/useCustomerStore";
import { useCreateClient } from "@/src/services/use-cases/createClient.usecase";
import { Client } from "@/src/types/clients/type.client";

// 1️⃣ Schema de validación Zod
const createClientSchema = z.object({
  dni: z.string().min(8, "DNI inválido"),
  firstName: z.string().min(1, "Nombres requeridos"),
  lastName: z.string().min(1, "Apellidos requeridos"),
  phone: z.string().min(9, "Celular requerido"),
  email: z.string().email("Correo inválido").optional().or(z.literal("")),
  address: z.string().min(1, "Dirección requerida"),
  city: z.string().min(1, "Distrito requerido"),
});

type CreateClientValues = z.infer<typeof createClientSchema>;

interface CreateClientModalProps {
  children: React.ReactNode;
  onCreated?: (client: Client) => void;
  defaultValues?: Partial<CreateClientValues>;
}

export function CreateClientModal({
  children,
  onCreated,
  defaultValues,
}: CreateClientModalProps) {
  const [open, setOpen] = useState(false);

  const { createClient } = useCreateClient();

  // 2️⃣ Estados del formulario
  const [values, setValues] = useState<CreateClientValues>({
    dni: defaultValues?.dni ?? "",
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateClientValues, string>>
  >({});

  React.useEffect(() => {
    if (defaultValues?.dni) {
      setValues((prev) => ({ ...prev, dni: defaultValues.dni! }));
    }
  }, [defaultValues?.dni]);

  // 3️⃣ Handler submit
  const handleSubmit = () => {
    const result = createClientSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: any = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0]] = err.message;
      });
      setErrors(fieldErrors);
      toast.error("Corrige los errores antes de continuar");
      return;
    }

    const newClient = createClient(result.data);

    setErrors({});

    setOpen(false);

    onCreated?.(newClient);
    toast.success(`Cliente ${newClient.firstName} creado correctamente`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-full max-w-lg max-h-dvh sm:max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 border-b">
          <DialogTitle>Crear Cliente</DialogTitle>
          <DialogDescription>
            Agrega un nuevo cliente al sistema.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6 space-y-4 overflow-y-auto">
          {/* DNI */}
          <div className="flex flex-col gap-1">
            <Label>DNI</Label>
            <Input
              value={values.dni}
              onChange={(e) => setValues({ ...values, dni: e.target.value })}
              maxLength={8}
              inputMode="numeric"
              autoFocus
            />
            {errors.dni && (
              <span className="text-xs text-red-500">{errors.dni}</span>
            )}
          </div>

          {/* Nombres y Apellidos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <Label>Nombres</Label>
              <Input
                value={values.firstName}
                onChange={(e) =>
                  setValues({ ...values, firstName: e.target.value })
                }
              />
              {errors.firstName && (
                <span className="text-xs text-red-500">{errors.firstName}</span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <Label>Apellidos</Label>
              <Input
                value={values.lastName}
                onChange={(e) =>
                  setValues({ ...values, lastName: e.target.value })
                }
              />
              {errors.lastName && (
                <span className="text-xs text-red-500">{errors.lastName}</span>
              )}
            </div>
          </div>

          {/* Celular y Correo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <Label>Celular</Label>
              <Input
                className="focus:border-none"
                value={values.phone}
                onChange={(e) =>
                  setValues({ ...values, phone: e.target.value })
                }
                maxLength={9}
                inputMode="numeric"
              />
              {errors.phone && (
                <span className="text-xs text-red-500">{errors.phone}</span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <Label>Correo (opcional)</Label>
              <Input
                type="email"
                value={values.email}
                onChange={(e) =>
                  setValues({ ...values, email: e.target.value })
                }
              />
              {errors.email && (
                <span className="text-xs text-red-500">{errors.email}</span>
              )}
            </div>
          </div>

          {/* Dirección y Distrito */}
          <div className="flex flex-col gap-1">
            <Label>Dirección</Label>
            <Input
              value={values.address}
              onChange={(e) =>
                setValues({ ...values, address: e.target.value })
              }
            />
            {errors.address && (
              <span className="text-xs text-red-500">{errors.address}</span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <Label>Distrito</Label>
            <Input
              value={values.city}
              onChange={(e) => setValues({ ...values, city: e.target.value })}
            />
            {errors.city && (
              <span className="text-xs text-red-500">{errors.city}</span>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 border-t flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="w-full sm:w-auto">
            Guardar Cliente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
