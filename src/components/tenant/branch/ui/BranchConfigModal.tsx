// components/branches/BranchConfigModal.tsx
"use client";

import { useEffect } from "react";
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
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { z } from "zod";
import { type SubmitHandler } from "react-hook-form";
import { type Branch } from "@/src/types/branch/type.branch";
import { type BranchConfig } from "@/src/types/branch/type.branchConfig";
import { DEFAULT_BRANCH_CONFIG, DEFAULT_LAUNCH_HOURS } from "@/src/lib/tenant-defaults";
import { BusinessHoursEditor } from "./BusinessHoursEditor";

// Definimos el schema del formulario de forma explícita para evitar problemas de inferencia con omit()
const formSchema = z.object({
  openHours: z.object({
    open: z.string().default(DEFAULT_LAUNCH_HOURS.open),
    close: z.string().default(DEFAULT_LAUNCH_HOURS.close),
    schedule: z.array(z.object({
      day: z.string(),
      enabled: z.boolean(),
      open: z.string(),
      close: z.string(),
    })).optional(),
  }),
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
      openHours: DEFAULT_BRANCH_CONFIG.openHours,
    },
  });

  useEffect(() => {
    if (config) {
      form.reset({
        openHours: config.openHours,
      });
    }
  }, [config, form]);

  const handleSubmit: SubmitHandler<FormValues> = (values) => {
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
            Configuración de {branch.name}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col h-full overflow-hidden"
          >
            <ScrollArea className="flex-1 pr-4 max-h-[60vh]">
              <div className="space-y-6">
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

                {/* Horario de atención extendido */}
                <BusinessHoursEditor />

                <Separator />

                <p className="text-xs text-muted-foreground italic">
                  Nota: Los días de lavandería y mantenimiento globales se gestionan
                  ahora desde el módulo de Políticas.
                </p>
              </div>
            </ScrollArea>

            <div className="flex justify-end gap-4 pt-6 mt-4 border-t">
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
