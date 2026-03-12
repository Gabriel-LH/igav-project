// components/catalogs/categories/CategoryForm.tsx
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
import {
  Plus,
  Folder,
  FolderTree,
  Image as ImageIcon,
  Palette,
  ShoppingCart,
  GripVertical,
} from "lucide-react";
import { Category, CategoryFormData } from "@/src/types/category/type.category";
import {
  flattenCategories,
  generateSlug,
} from "@/src/utils/category/categoryTree";
import { cn } from "@/lib/utils";

// Iconos disponibles (subset de Lucide)
const AVAILABLE_ICONS = [
  "Smartphone",
  "Laptop",
  "Home",
  "Shirt",
  "ShoppingBag",
  "Utensils",
  "Armchair",
  "Car",
  "BookOpen",
  "Dumbbell",
  "Palette",
  "Music",
  "Camera",
  "Gift",
  "Heart",
];

const formSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  description: z.string().optional(),
  parentId: z.string().optional(),
  image: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  order: z.number(),
  isActive: z.boolean(),
  showInPos: z.boolean(),
  showInEcommerce: z.boolean(),
});

interface CategoryFormProps {
  categories: Category[]; // Para selector de padre
  initialData?: Category;
  defaultParentId?: string;
  onSubmit: (data: CategoryFormData) => void;
  trigger?: React.ReactNode;
  compact?: boolean;
}

export function CategoryForm({
  categories,
  initialData,
  defaultParentId,
  onSubmit,
  trigger,
  compact = false,
}: CategoryFormProps) {
  const [open, setOpen] = useState(false);
  const isEditing = !!initialData;

  // Excluir la categoría actual y sus descendientes si estamos editando
  const availableParents = useMemo(() => {
    let filtered = categories.filter((c) => c.isActive);
    if (isEditing) {
      // No puedes ser padre de ti mismo ni de tus descendientes
      const descendants = getDescendantIds(categories, initialData!.id);
      filtered = filtered.filter(
        (c) => c.id !== initialData!.id && !descendants.includes(c.id),
      );
    }
    return flattenCategories(filtered);
  }, [categories, isEditing, initialData]);

  const existingSlugs = useMemo(
    () =>
      categories
        .map((c) => c.slug)
        .filter((s): s is string => Boolean(s) && s !== initialData?.slug),
    [categories, initialData],
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          description: initialData.description || "",
          parentId: initialData.parentId || defaultParentId || "",
          image: initialData.image || "",
          icon: initialData.icon || "Folder",
          color: initialData.color || "#3b82f6",
          order: initialData.order ?? 0,
          isActive: initialData.isActive ?? true,
          showInPos: initialData.showInPos ?? true,
          showInEcommerce: initialData.showInEcommerce ?? true,
        }
      : {
          name: "",
          description: "",
          parentId: defaultParentId || "",
          image: "",
          icon: "Folder",
          color: "#3b82f6",
          order: 0,
          isActive: true,
          showInPos: true,
          showInEcommerce: true,
        },
  });

  const selectedParentId = form.watch("parentId");
  const selectedParent = categories.find((c) => c.id === selectedParentId);

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    const slug = generateSlug(values.name, existingSlugs);

    onSubmit({
      ...values,
      slug,
    });

    form.reset();
    setOpen(false);
  };

  return (
    <EntityModal
      open={open}
      onOpenChange={setOpen}
      title={isEditing ? "Editar Categoría" : "Nueva Categoría"}
      description={
        isEditing
          ? "Modifica la categoría y su jerarquía."
          : "Crea una categoría principal o subcategoría."
      }
      maxWidth="lg"
      trigger={
        trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Categoría
          </Button>
        )
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Jerarquía - Selector de Padre */}
          <FormField
            control={form.control}
            name="parentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <FolderTree className="w-4 h-4" />
                  Categoría Padre
                </FormLabel>
                <Select
                  onValueChange={(val) =>
                    field.onChange(val === "root" ? undefined : val)
                  }
                  value={field.value || "root"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona categoría padre..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="root">
                      <div className="flex items-center gap-2">
                        <span className="w-4" /> {/* Indent */}
                        <span className="font-medium flex items-center gap-2">
                          <Folder className="w-4 h-4 text-primary" /> Categoría
                          Principal (Raíz)
                        </span>
                      </div>
                    </SelectItem>
                    {availableParents.map((parent) => (
                      <SelectItem
                        key={parent.value}
                        value={parent.value}
                        disabled={parent.disabled}
                      >
                        <div className="flex items-center gap-2">
                          <span style={{ width: parent.level * 20 }} />
                          {parent.level > 0 && (
                            <span className="text-muted-foreground">└─</span>
                          )}
                          <span
                            className={cn(
                              parent.disabled && "text-muted-foreground",
                            )}
                          >
                            {parent.label}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {selectedParent
                    ? `Será subcategoría de "${selectedParent.name}" (Nivel ${(selectedParent.level ?? 0) + 1})`
                    : "Será una categoría principal de primer nivel"}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Nombre y Descripción */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Folder className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        className="pl-9"
                        placeholder="Ej: Electrodomésticos"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!compact && (
              <FormField
                control={form.control}
                name="order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4" />
                    Orden
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Orden entre categorías hermanas
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
              />
            )}
          </div>

          {!compact && (
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Descripción de la categoría..."
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {!compact && (
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icono</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {AVAILABLE_ICONS.map((icon) => (
                          <SelectItem key={icon} value={icon}>
                            {icon}
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
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      Color
                    </FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          {...field}
                          className="w-12 h-10 p-1"
                        />
                        <Input
                          {...field}
                          placeholder="#3b82f6"
                          className="flex-1"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      URL Imagen
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {!compact && (
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="showInPos"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4" />
                        Mostrar en POS
                      </FormLabel>
                      <FormDescription>Visible en punto de venta</FormDescription>
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

              {/* E-commerce (comentado por ahora) */}
              {/*
              <FormField
                control={form.control}
                name="showInEcommerce"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Mostrar en Tienda
                      </FormLabel>
                      <FormDescription>Visible en e-commerce</FormDescription>
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
              */}
            </div>
          )}

          {!compact && (
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4 bg-muted/50">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Categoría Activa</FormLabel>
                    <FormDescription>
                      Desactivar oculta la categoría y sus subcategorías
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
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {isEditing ? "Guardar Cambios" : "Crear Categoría"}
            </Button>
          </div>
        </form>
      </Form>
    </EntityModal>
  );
}

// Helper local
function getDescendantIds(categories: Category[], parentId: string): string[] {
  const result: string[] = [];
  const children = categories.filter((c) => c.parentId === parentId);
  children.forEach((child) => {
    result.push(child.id);
    result.push(...getDescendantIds(categories, child.id));
  });
  return result;
}

