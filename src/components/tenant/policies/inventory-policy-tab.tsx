"use client";

import { useFormContext } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import type { TenantPolicy } from "@/src/types/tenant/type.tenantPolicy";

export function InventoryPoliciesTab() {
  const { control } = useFormContext<TenantPolicy>();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="mt-3 flex items-center gap-2">
          Politicas de Inventario
        </CardTitle>
        <CardDescription>
          Aqui solo quedan reglas operativas de inventario que no dependen de la
          configuracion general. El stock negativo se configura en Ajustes {">"}{" "}
          Precios y el bloqueo por reserva ya lo resuelve el flujo de reservas.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
          <p>
            No hay políticas operativas adicionales para configurar en esta
            sección.
          </p>
          <p className="mt-2">
            Recuerde que el **Stock Negativo** se configura en el módulo de
            Configuración General (Ajustes {">"} Precios).
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
