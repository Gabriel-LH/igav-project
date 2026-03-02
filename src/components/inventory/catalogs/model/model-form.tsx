// components/catalogs/models/ModelForm.tsx
"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Tag, Hash, FileText, Calendar, Building2 } from "lucide-react";
import { Model, ModelFormData } from "@/src/types/model/type.model";
import { Brand } from "@/src/types/brand/type.brand";

const formSchema = z.object({
  brandId: z.string().min(1, "Marca requerida"),
  name: z.string().min(1, "Nombre requerido"),
  slug: z.string().min(1, "Slug requerido"),
  description: z.string().optional(),
  year: z.number().optional(),
  isActive: z.boolean().default(true),
});

interface ModelFormProps {
  brands: Brand[]; // Lista de marcas para el selector
  initialData?: Model;
  onSubmit: (data: ModelFormData) => void;
  trigger?: React.ReactNode;
}

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export function ModelForm({
  brands,
  initialData,
  onSubmit,
  trigger,
}: ModelFormProps) {
  const [open, setOpen] = useState(false);
  const isEditing = !!initialData;

  // Solo marcas activas
  const activeBrands = useMemo(
    () =>
      brands
        .filter((b) => b.isActive)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [brands],
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      brandId: "",
      name: "",
      slug: "",
      description: "",
      year: undefined,
      isActive: true,
    },
  });

  const watchName = form.watch("name");
  if (!isEditing && watchName && !form.getValues("slug")) {
    form.setValue("slug", generateSlug(watchName));
  }

  const selectedBrandId = form.watch("brandId");
  const selectedBrand = brands.find((b) => b.id === selectedBrandId);

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values);
    form.reset();
    setOpen(false);
  };

  return (
    <EntityModal
      open={open}
      onOpenChange={setOpen}
      title={isEditing ? "Editar Modelo" : "Nuevo Modelo"}
      description="Crea un modelo y asígnalo a una marca."
      maxWidth="md"
      trigger={
        trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Modelo
          </Button>
        )
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Selector de Marca */}
          <FormField
            control={form.control}
            name="brandId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Marca *
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una marca..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {activeBrands.length === 0 && (
                      <SelectItem value="" disabled>
                        No hay marcas activas
                      </SelectItem>
                    )}
                    {activeBrands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{brand.name}</span>
                          {brand.description && (
                            <span className="text-xs text-muted-foreground">
                              - {brand.description}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  El modelo pertenecerá a esta marca
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Info de marca seleccionada */}
          {selectedBrand && (
            <div className="p-3 bg-muted rounded-lg flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {selectedBrand.name[0]}
              </div>
              <div>
                <div className="font-medium">{selectedBrand.name}</div>
                <div className="text-xs text-muted-foreground">
                  {selectedBrand.slug}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Nombre *
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ej: Galaxy S24" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    Slug *
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="galaxy-s24"
                      className="lowercase"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Año (opcional)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? Number(e.target.value) : undefined,
                        )
                      }
                      placeholder="2024"
                    />
                  </FormControl>
                  <FormDescription>
                    Año de lanzamiento del modelo
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Descripción
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Descripción opcional..."
                    rows={2}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>Modelo Activo</FormLabel>
                  <FormDescription>
                    Los modelos inactivos no aparecen en selecciones
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

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!selectedBrandId}>
              {isEditing ? "Guardar Cambios" : "Crear Modelo"}
            </Button>
          </div>
        </form>
      </Form>
    </EntityModal>
  );
}
