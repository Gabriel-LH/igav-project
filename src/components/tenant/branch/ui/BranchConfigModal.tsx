// components/branches/BranchConfigModal.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Separator } from "@/components/ui/separator";
import { z } from "zod";
import { type Branch } from "@/src/types/branch/type.branch";
import { type BranchConfig } from "@/src/types/branch/type.branchConfig";
import { branchConfigSchema } from "@/src/types/branch/type.branchConfig";

// Extendemos el schema para el formulario (omitiendo lo que no es del form y los campos deprecados)
const formSchema = branchConfigSchema.omit({
  id: true,
  branchId: true,
  createdAt: true,
  updatedAt: true,
  daysInLaundry: true,
  daysInMaintenance: true,
});

type FormValues = z.infer<typeof formSchema>;

interface BranchConfigModalProps {
  branch: Branch;
  config?: BranchConfig;
  onClose: () => void;
  onSave: (config: BranchConfig) => void;
}

export function BranchConfigModal({
  branch,
  config,
  onClose,
  onSave,
}: BranchConfigModalProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      openHours: {
        open: "08:00",
        close: "20:00",
      },
    },
  });

  useEffect(() => {
    if (config) {
      form.reset({
        openHours: config.openHours,
      });
    }
  }, [config, form]);

  const handleSubmit = (values: FormValues) => {
    const newConfig: BranchConfig = {
      id: config?.id || crypto.randomUUID(),
      branchId: branch.id,
      ...values,
      daysInLaundry: config?.daysInLaundry || 0, // Mantener los valores existentes en DB por si acaso
      daysInMaintenance: config?.daysInMaintenance || 0,
      createdAt: config?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    onSave(newConfig);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>⚙️</span>
            Configuración de {branch.name}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {/* Información de la sucursal (solo lectura) */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium">Información de la sucursal</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Código:</span>
                <span className="font-mono">{branch.code}</span>
                <span className="text-muted-foreground">Ciudad:</span>
                <span>{branch.city}</span>
              </div>
            </div>

            <Separator />

            {/* Horario de atención */}
            <div className="space-y-4">
              <h3 className="font-medium">Horario de atención</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="openHours.open"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apertura</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="openHours.close"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cierre</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />
            
            <p className="text-xs text-muted-foreground italic">
              Nota: Los días de lavandería y mantenimiento globales se gestionan ahora desde el módulo de Políticas.
            </p>

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
