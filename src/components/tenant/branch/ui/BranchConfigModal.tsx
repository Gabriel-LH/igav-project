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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { z } from "zod";
import { type Branch } from "@/src/types/branch/type.branch";
import { type BranchConfig } from "@/src/types/branch/type.branchConfig";
import { branchConfigSchema } from "@/src/types/branch/type.branchConfig";

// Extendemos el schema para el formulario
const formSchema = branchConfigSchema.omit({
  branchId: true,
  createdAt: true,
  updatedAt: true,
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
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      openHours: {
        open: "08:00",
        close: "20:00",
      },
      daysInLaundry: 2,
      daysInMaintenance: 7,
    },
  });

  useEffect(() => {
    if (config) {
      form.reset({
        openHours: config.openHours,
        daysInLaundry: config.daysInLaundry,
        daysInMaintenance: config.daysInMaintenance,
      });
    }
  }, [config, form]);

  const handleSubmit = (values: FormValues) => {
    const newConfig: BranchConfig = {
      branchId: branch.id,
      ...values,
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

            {/* Parámetros operativos */}
            <div className="space-y-4">
              <h3 className="font-medium">Parámetros operativos</h3>

              <FormField
                control={form.control}
                name="daysInLaundry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Días en lavandería</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="30"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Tiempo estimado para proceso de lavado
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="daysInMaintenance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Días en mantenimiento</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="60"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Tiempo estimado para mantenimiento de equipos
                    </FormDescription>
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
