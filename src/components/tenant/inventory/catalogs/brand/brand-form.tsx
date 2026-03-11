// components/catalogs/brands/BrandForm.tsx
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { Plus, Tag, Hash, Image, FileText } from "lucide-react";
import { Brand, BrandFormData } from "@/src/types/brand/type.brand";
import { generateSlug } from "@/src/utils/slug/generate-slug";

const formSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  slug: z.string().min(1, "Slug requerido"),
  description: z.string().optional(),
  logo: z.string().optional(),
  isActive: z.boolean(),
});
type BrandFormValues = z.infer<typeof formSchema>;

interface BrandFormProps {
  initialData?: Brand;
  onSubmit: (data: BrandFormData) => void;
  trigger?: React.ReactNode;
}

// Generar slug automático

export function BrandForm({ initialData, onSubmit, trigger }: BrandFormProps) {
  const [open, setOpen] = useState(false);
  const isEditing = !!initialData;
  const [userModifiedSlug, setUserModifiedSlug] = useState(false);

  const form = useForm<BrandFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: "",
      slug: "",
      description: "",
      logo: "",
      isActive: true,
    },
  });

  // Auto-generar slug cuando cambia el nombre (solo si no está editando)
  const watchName = form.watch("name");
  useEffect(() => {
    if (!isEditing && watchName && !userModifiedSlug) {
      form.setValue("slug", generateSlug(watchName));
    }
  }, [form, isEditing, watchName, userModifiedSlug]);

  const _ = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserModifiedSlug(true);
    const value = e.target.value
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");
    form.setValue("slug", value);
  }
  const handleSubmit = (values: BrandFormValues) => {
    onSubmit(values);
    form.reset();
    setOpen(false);
  };

  return (
    <EntityModal
      open={open}
      onOpenChange={setOpen}
      title={isEditing ? "Editar Marca" : "Nueva Marca"}
      description="Gestiona las marcas de tus productos."
      maxWidth="md"
      trigger={
        trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Marca
          </Button>
        )
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                  <Input {...field} placeholder="Ej: Samsung" />
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
                    placeholder="samsung"
                    className="lowercase"
                    onChange={(e) => {
                      field.onChange(e);
                      if (!isEditing) {
                        setUserModifiedSlug(true);
                      }
                    }}
                  />
                </FormControl>
                <FormDescription>
                  Identificador único en URL (minúsculas, sin espacios, usa _
                  para separar)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

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
                    placeholder="Descripción opcional de la marca..."
                    rows={2}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="logo"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  URL del Logo
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder="https://..." />
                </FormControl>
                <FormDescription>
                  URL de la imagen del logo (opcional)
                </FormDescription>
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
                  <FormLabel>Marca Activa</FormLabel>
                  <FormDescription>
                    Las marcas inactivas no aparecen en selecciones
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
            <Button type="submit">
              {isEditing ? "Guardar Cambios" : "Crear Marca"}
            </Button>
          </div>
        </form>
      </Form>
    </EntityModal>
  );
}
