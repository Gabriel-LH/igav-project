// components/catalogs/attribute-types/AttributeTypeForm.tsx
"use client";

import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { EntityModal } from "../ui/EntityModal";
import { Plus, Tag, Hash, ToggleLeft, Box } from "lucide-react";
import {
  AttributeType,
  AttributeTypeFormData,
  attributeTypeSchema,
} from "@/src/types/attributes/type.attribute-type";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const inputTypeOptions = [
  { value: "text", label: "Texto", icon: "T" },
  { value: "number", label: "Número", icon: "123" },
  { value: "select", label: "Selección", icon: "☰" },
  { value: "boolean", label: "Sí/No", icon: "✓" },
  { value: "color", label: "Color", icon: "●" },
  { value: "date", label: "Fecha", icon: "📅" },
];

const formSchema = attributeTypeSchema.omit({ id: true, tenantId: true });

interface AttributeTypeFormProps {
  initialData?: AttributeType;
  onSubmit: (data: AttributeTypeFormData) => void;
  trigger?: React.ReactNode;
  compact?: boolean;
}

export function AttributeTypeForm({
  initialData,
  onSubmit,
  trigger,
  compact = false,
}: AttributeTypeFormProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: "",
      code: "",
      inputType: "text",
      isVariant: false,
      affectsSku: false,
      isActive: true,
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values);
    form.reset();
    setOpen(false);
  };

  const isEditing = !!initialData;

  return (
    <EntityModal
      open={open}
      onOpenChange={setOpen}
      title={isEditing ? "Editar Tipo de Atributo" : "Nuevo Tipo de Atributo"}
      description="Define las características del atributo para usarlo en productos."
      maxWidth="md"
      trigger={
        trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Crear Tipo de Atributo
          </Button>
        )
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Nombre y Código */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Tag className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        className="pl-9"
                        placeholder="Ej: Color"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Hash className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        className="pl-9 uppercase"
                        placeholder="Ej: COLOR"
                        onChange={(e) =>
                          field.onChange(e.target.value.toUpperCase())
                        }
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Identificador único en mayúsculas
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Tipo de Input */}
          <FormField
            control={form.control}
            name="inputType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Input *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo de entrada..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {inputTypeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <span className="w-6 text-center">{opt.icon}</span>
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Determina cómo se mostrará este atributo en los formularios
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Switches de comportamiento */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <FormField
              control={form.control}
              name="isVariant"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm bg-background">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base flex items-center gap-2">
                      <Box className="w-4 h-4" />
                      Usar para Variantes
                    </FormLabel>
                    <FormDescription>
                      Este atributo generará variantes de producto (Color,
                      Talla)
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
              name="affectsSku"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm bg-background">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base flex items-center gap-2">
                      <Hash className="w-4 h-4" />
                      Afecta SKU
                    </FormLabel>
                    <FormDescription>
                      Las variantes incluirán este atributo en el código SKU
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={!form.watch("isVariant")}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {!compact && (
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm bg-background">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base flex items-center gap-2">
                        <ToggleLeft className="w-4 h-4" />
                        Activo
                      </FormLabel>
                      <FormDescription>
                        Disponible para usar en productos
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
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {isEditing ? "Guardar Cambios" : "Crear Tipo de Atributo"}
            </Button>
          </div>
        </form>
      </Form>
    </EntityModal>
  );
}
