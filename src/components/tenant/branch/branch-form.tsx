// components/branches/BranchForm.tsx
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  branchSchema,
  type Branch,
} from "@/src/application/interfaces/branch/branch";
import { z } from "zod";
import { Star } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Call02Icon,
  CallEnd01Icon,
  InformationCircleIcon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";

// Extendemos el schema para validaciones de formulario
const formSchema = branchSchema
  .omit({
    id: true,
    tenantId: true,
    createdAt: true,
    updatedAt: true,
    createdBy: true,
    updatedBy: true,
    metadata: true,
  })
  .extend({
    code: z.string().min(2, "El código debe tener al menos 2 caracteres"),
    name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
    city: z.string().min(2, "La ciudad es requerida"),
    address: z.string().min(5, "La dirección es requerida"),
    phone: z.string().optional(),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    timezone: z.string(),
    isPrimary: z.boolean(),
    status: z.enum(["active", "inactive"]),
  });

type FormValues = z.infer<typeof formSchema>;

interface BranchFormProps {
  branch?: Branch | null;
  allBranches: Branch[];
  onClose: () => void;
  onSubmit: (branch: Branch) => void;
}

const TIMEZONES = [
  "America/Lima",
  "America/Bogota",
  "America/Mexico_City",
  "America/Argentina/Buenos_Aires",
  "America/Santiago",
  "America/Caracas",
  "America/Panama",
  "America/Guayaquil",
  "America/La_Paz",
];

export function BranchForm({
  branch,
  allBranches,
  onClose,
  onSubmit,
}: BranchFormProps) {
  const [codeError, setCodeError] = useState<string>("");
  const [primaryWarning, setPrimaryWarning] = useState<string>("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      name: "",
      city: "",
      address: "",
      phone: "",
      email: "",
      timezone: "America/Lima",
      isPrimary: false,
      status: "active",
    },
  });

  useEffect(() => {
    if (branch) {
      form.reset({
        code: branch.code,
        name: branch.name,
        city: branch.city,
        address: branch.address,
        phone: branch.phone || "",
        email: branch.email || "",
        timezone: branch.timezone,
        isPrimary: branch.isPrimary,
        status: branch.status,
      });
    }
  }, [branch, form]);

  const watchIsPrimary = form.watch("isPrimary");

  useEffect(() => {
    if (watchIsPrimary && !branch?.isPrimary) {
      const existingPrimary = allBranches.find(
        (b) => b.isPrimary && b.id !== branch?.id,
      );
      if (existingPrimary) {
        setPrimaryWarning(
          `Ya existe una sucursal principal (${existingPrimary.name}). Al guardar, esta pasará a ser secundaria.`,
        );
      } else {
        setPrimaryWarning("");
      }
    } else {
      setPrimaryWarning("");
    }
  }, [watchIsPrimary, allBranches, branch]);

  const handleSubmit = (values: FormValues) => {
    // Validar código único
    const existingCode = allBranches.find(
      (b) => b.code === values.code && b.id !== branch?.id,
    );

    if (existingCode) {
      setCodeError("El código ya existe. Debe ser único por tenant.");
      return;
    }

    setCodeError("");

    const newBranch: Branch = {
      id: branch?.id || crypto.randomUUID(),
      tenantId: "tenant-1", // En producción, vendría del contexto
      ...values,
      createdAt: branch?.createdAt || new Date(),
      updatedAt: new Date(),
      createdBy: branch?.createdBy || "current-user",
      updatedBy: "current-user",
      metadata: branch?.metadata || {},
    };

    onSubmit(newBranch);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {branch ? "Editar sucursal" : "Nueva sucursal"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {/* Sección 1: Información básica */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <HugeiconsIcon icon={InformationCircleIcon} />
                Información básica
              </h3>

              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: SUC001" {...field} />
                    </FormControl>
                    <FormDescription>
                      Código único para identificar la sucursal
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Sucursal Centro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ciudad</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Lima" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección</FormLabel>
                      <FormControl>
                        <Input placeholder="Dirección completa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Sección 2: Contacto */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <HugeiconsIcon icon={Call02Icon} />
                Contacto
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input placeholder="+51 1 234-5678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="sucursal@empresa.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Sección 3: Configuración */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <HugeiconsIcon icon={Settings01Icon} />
                Configuración
              </h3>

              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zona horaria</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar zona horaria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIMEZONES.map((tz) => (
                          <SelectItem key={tz} value={tz}>
                            {tz}
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
                name="isPrimary"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base flex items-center gap-2">
                        <Star className="h-4 w-4 text-amber-500" />
                        Marcar como principal
                      </FormLabel>
                      <FormDescription>
                        La sucursal principal será la predeterminada para
                        operaciones
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

              {primaryWarning && (
                <Alert>
                  <AlertDescription>{primaryWarning}</AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Estado activo</FormLabel>
                      <FormDescription>
                        Las sucursales inactivas no aparecerán en las
                        operaciones diarias
                      </FormDescription>
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
            </div>

            {codeError && (
              <Alert variant="destructive">
                <AlertDescription>{codeError}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">
                {branch ? "Actualizar" : "Crear"} sucursal
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
