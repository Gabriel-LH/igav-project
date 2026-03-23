// components/catalogs/attribute-values/AttributeValueForm.tsx
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Plus, Tag, Hash, Palette, ToggleLeft } from "lucide-react";
import {
  AttributeValue,
  AttributeValueFormData,
  attributeValueSchema,
} from "@/src/types/attributes/type.attribute-value";
import { AttributeType } from "@/src/types/attributes/type.attribute-type";

const formSchema = attributeValueSchema
  .omit({ id: true, tenantId: true })
  .extend({
    hexColor: z.string().optional(),
  });

interface AttributeValueFormProps {
  initialData?: AttributeValue;
  attributeTypes: AttributeType[]; // Lista de tipos disponibles
  defaultAttributeTypeId?: string;
  onSubmit: (data: AttributeValueFormData) => void;
  compact?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AttributeValueForm({
  initialData,
  attributeTypes,
  defaultAttributeTypeId,
  onSubmit,
  open,
  onOpenChange,
  compact = false,
}: AttributeValueFormProps) {

  const [userModifiedCode, setUserModifiedCode] = useState(false);
  const isEditing = !!initialData;

  // Generar código automático desde el valor (primeros 3 chars)
  const generateCode = (value: string) => {
    return value
      .substring(0, 3)
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Z0-9]/g, "");
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      code: "",
      value: "",
      attributeTypeId: defaultAttributeTypeId || "",
      hexColor: "",
      isActive: true,
    },
  });

  useEffect(() => {
    form.reset(
      initialData || {
        code: "",
        value: "",
        attributeTypeId: defaultAttributeTypeId || "",
        hexColor: "",
        isActive: true,
      },
    );
    setUserModifiedCode(false);
  }, [defaultAttributeTypeId, form, initialData, open]);

  useEffect(() => {
    if (!initialData && defaultAttributeTypeId) {
      const currentTypeId = form.getValues("attributeTypeId");
      if (!currentTypeId) {
        form.setValue("attributeTypeId", defaultAttributeTypeId);
      }
    }
  }, [defaultAttributeTypeId, form, initialData]);

  const selectedTypeId = form.watch("attributeTypeId");
  const selectedType = attributeTypes.find((t) => t.id === selectedTypeId);

  // Auto-generate code when value changes
  const watchValue = form.watch("value");
  useEffect(() => {
    if (!isEditing && watchValue && !userModifiedCode) {
      form.setValue("code", generateCode(watchValue));
    }
  }, [form, isEditing, watchValue, userModifiedCode]);

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    const hexColor = values.hexColor?.trim() || undefined;
    if (
      selectedType?.inputType === "color" &&
      hexColor &&
      !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hexColor)
    ) {
      form.setError("hexColor", { message: "Hex inválido" });
      return;
    }

    const payload =
      selectedType?.inputType === "color"
        ? { ...values, hexColor }
        : { ...values, hexColor: undefined };

    onSubmit(payload);
    form.reset();
    setUserModifiedCode(false);
    onOpenChange?.(false);
  };

  return (
    <EntityModal
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Editar Valor de Atributo" : "Nuevo Valor de Atributo"}
      description="Define un valor específico para un tipo de atributo existente."
      maxWidth="md"
  
    >
      <Form {...form}>
        <form onSubmit={(e) => { e.stopPropagation(); form.handleSubmit(handleSubmit)(e); }} className="space-y-6">
          {/* Selector de Tipo de Atributo */}
          {!(compact && defaultAttributeTypeId) && (
            <FormField
              control={form.control}
              name="attributeTypeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Atributo *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <div className="flex items-center gap-2">
                        <Palette className="w-4 h-4 text-muted-foreground" />
                        <SelectValue placeholder="Selecciona el tipo de atributo..." />
                      </div>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {attributeTypes
                      .filter((t) => t.isActive)
                      .map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          <div className="flex flex-col">
                            <span>{type.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {type.code} • {type.inputType}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  El valor será asociado a este tipo de atributo
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
            />
          )}

          {/* Info del tipo seleccionado */}
          {selectedType && (
            <div className="p-3 bg-muted rounded-lg flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Tag className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-medium">{selectedType.name}</div>
                <div className="text-xs text-muted-foreground">
                  {selectedType.isVariant
                    ? "Genera variantes"
                    : "Atributo simple"}{" "}
                  •{selectedType.affectsSku ? " Afecta SKU" : " No afecta SKU"}
                </div>
              </div>
            </div>
          )}

          {/* Valor y Código */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Tag className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        className="pl-9"
                        placeholder="Ej: Rojo"
                      />
                    </div>
                  </FormControl>
                  <FormDescription>Nombre visible del valor</FormDescription>
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
                        className="pl-9 uppercase font-mono"
                        placeholder="Ej: ROJO"
                        onChange={(e) => {
                          field.onChange(e.target.value.toUpperCase());
                          setUserModifiedCode(true);
                        }}
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

          {selectedType?.inputType === "color" && (
            <FormField
              control={form.control}
              name="hexColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color Hexadecimal</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={field.value || "#000000"}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="w-14 p-1"
                      />
                      <Input
                        {...field}
                        value={field.value || ""}
                        placeholder="#000000"
                        className="font-mono uppercase"
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Se usa para mostrar el color real en tarjetas de producto.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Switch de Activo */}
          {!compact && (
            <FormField
              control={form.control}
              name="isActive"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4 shadow-sm">
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

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange?.(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!selectedTypeId}>
              {isEditing ? "Guardar Cambios" : "Crear Valor"}
            </Button>
          </div>
        </form>
      </Form>
    </EntityModal>
  );
}
