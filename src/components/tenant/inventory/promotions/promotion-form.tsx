"use client";

import { FieldErrors, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createPromotionSchema,
  CreatePromotionInput,
  Promotion,
} from "@/src/types/promotion/type.promotion";
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  createPromotionAction,
  updatePromotionAction,
} from "@/src/app/(tenant)/tenant/actions/promotion.actions";
import { toast } from "sonner";
import { useState, useEffect, useMemo } from "react";
import { useTenantConfigStore } from "@/src/store/useTenantConfigStore";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Search, X, Package, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { getProductsAction } from "@/src/app/(tenant)/tenant/actions/product.actions";
import { getCategoriesAction } from "@/src/app/(tenant)/tenant/actions/category.actions";
import { Product } from "@/src/types/product/type.product";
import { Category } from "@/src/types/category/type.category";
import { Badge } from "@/components/badge";
import { flattenCategories } from "@/src/utils/category/categoryTree";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface PromotionFormProps {
  initialValues?: Promotion;
  onSuccess: () => void;
}

export function PromotionForm({
  onSuccess,
  initialValues,
}: PromotionFormProps) {
  const { config, ensureLoaded } = useTenantConfigStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = !!initialValues?.id;

  useEffect(() => {
    ensureLoaded();
  }, [ensureLoaded]);

  const form = useForm<CreatePromotionInput>({
    resolver: zodResolver(createPromotionSchema) as any,
    defaultValues: useMemo((): any => {
      const baseValues = {
        name: initialValues?.name ?? "",
        type: initialValues?.type ?? "percentage",
        scope: initialValues?.scope ?? "global",
        value: initialValues?.value ?? 0,
        appliesTo:
          (initialValues?.appliesTo as CreatePromotionInput["appliesTo"]) ?? [
            "venta",
          ],
        isExclusive: initialValues?.isExclusive ?? true,
        startDate: initialValues?.startDate
          ? new Date(initialValues.startDate)
          : new Date(),
        endDate: initialValues?.endDate
          ? new Date(initialValues.endDate)
          : undefined,
        isActive: initialValues?.isActive ?? true,
        combinable: initialValues?.combinable ?? true,
        requiresCode: initialValues?.requiresCode ?? false,
        singleUsePerCustomer: initialValues?.singleUsePerCustomer ?? false,
        usageType:
          (initialValues?.usageType as CreatePromotionInput["usageType"]) ??
          "automatic",
        targetIds: initialValues?.targetIds ?? [],
        bundleConfig: initialValues?.bundleConfig
          ? {
              requiredProductIds: initialValues.bundleConfig.requiredProductIds,
              bundlePrice: initialValues.bundleConfig.bundlePrice,
              prorateStrategy: initialValues.bundleConfig.prorateStrategy,
            }
          : {
              requiredProductIds: [],
              bundlePrice: 0,
              prorateStrategy: "proportional" as const,
            },
        isDeleted: initialValues?.isDeleted ?? false,
      };
      return baseValues;
    }, [initialValues]),
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedTargets, setSelectedTargets] = useState<
    (Product | Category)[]
  >([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [categorySearchOpen, setCategorySearchOpen] = useState(false);

  // Helper to get all subcategories
  const getDescendantIds = (catId: string, allCats: Category[]): string[] => {
    const children = allCats.filter((c) => c.parentId === catId);
    let ids = children.map((c) => c.id);
    for (const child of children) {
      ids = [...ids, ...getDescendantIds(child.id, allCats)];
    }
    return ids;
  };

  useEffect(() => {
    const loadData = async () => {
      const [prodRes, catRes] = await Promise.all([
        getProductsAction(),
        getCategoriesAction(),
      ]);
      if (prodRes.success && prodRes.data) {
        setProducts(prodRes.data.products);
      }
      if (catRes.success && catRes.data) {
        const cats = catRes.data as Category[];
        setCategories(cats);

        if (initialValues) {
          const targets: any[] = [];
          if (initialValues.bundleConfig && prodRes.data) {
            const bundleProducts = prodRes.data.products.filter((p) =>
              (initialValues.bundleConfig as any).requiredProductIds?.includes(
                p.id,
              ),
            );
            targets.push(
              ...bundleProducts.map((p) => ({
                ...p,
                __type: "bundle_product",
              })),
            );
          }
          if (initialValues.scope === "category") {
            const selectedCats = cats.filter((c) =>
              initialValues.targetIds?.includes(c.id),
            );
            targets.push(
              ...selectedCats.map((c) => ({ ...c, __type: "category" })),
            );
          }
          if (initialValues.scope === "product_specific" && prodRes.data) {
            const selectedProds = prodRes.data.products.filter((p) =>
              initialValues.targetIds?.includes(p.id),
            );
            targets.push(
              ...selectedProds.map((p) => ({ ...p, __type: "product_target" })),
            );
          }
          setSelectedTargets(targets as (Product | Category)[]);
        }
      }
    };
    loadData();
  }, [initialValues]);

  const flatCategories = useMemo(() => {
    return flattenCategories(categories.filter((cat) => cat.isActive));
  }, [categories]);

  const watchType = form.watch("type");

  useEffect(() => {
    if (watchType === "bundle") {
      form.setValue("scope", "pack");
    }
  }, [watchType, form]);

  const watchValue = form.watch("value") ?? 0;
  const maxAllowed = config?.pricing.maxDiscountLimit ?? 100;

  const isOverLimit = watchType === "percentage" && watchValue > maxAllowed;

  const onSubmit = async (data: CreatePromotionInput) => {
    setIsSubmitting(true);
    try {
      let res;
      if (isEdit && initialValues?.id) {
        res = await updatePromotionAction(initialValues.id, data);
      } else {
        res = await createPromotionAction(data);
      }

      if (res.success) {
        toast.success(isEdit ? "Promoción actualizada" : "Promoción creada");
        onSuccess();
      } else {
        toast.error(
          res.error ||
            `No se pudo ${isEdit ? "actualizar" : "crear"} la promoción`,
        );
      }
    } catch (err) {
      console.error(err);
      toast.error(
        isEdit ? "Error al actualizar promoción" : "Error al crear promoción",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const onInvalid = (errors: FieldErrors<CreatePromotionInput>) => {
    console.error("Errores de validación:", errors);
    toast.error("Por favor, revisa los campos obligatorios");
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, onInvalid)}
        className="space-y-4 py-4"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la Promoción</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Descuento de Verano" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha de Inicio</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: es })
                        ) : (
                          <span>Selecciona una fecha</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha de Fin (Opcional)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: es })
                        ) : (
                          <span>Sin fecha de expiración</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < form.getValues("startDate")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Descuento</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                    <SelectItem value="fixed_amount">
                      Monto Fijo (S/)
                    </SelectItem>
                    <SelectItem value="bundle">Combo / Paquete</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {watchType !== "bundle" && (
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        field.onChange(isNaN(val) ? 0 : val);
                      }}
                      value={field.value ?? 0}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {watchType === "bundle" && (
          <div className="bg-blue-500/5 border-blue-500/20 w-full p-2">
            <div className="flex w-full items-center gap-2">
              <div className="flex flex-col">
                <span className="text-blue-500 font-bold text-xs uppercase mb-1">
                  Configuración de Combo
                </span>
                <span className="text-xs text-muted-foreground">
                  Este tipo de descuento se aplica automáticamente cuando el
                  cliente agrega **todos los productos requeridos** al carrito.
                  El sistema detectará el combo y asignará el precio especial de
                  forma prorrateada.
                </span>
              </div>
            </div>
          </div>
        )}

        {watchType === "bundle" && (
          <div className="space-y-4 p-4 bg-slate-500/5 rounded-lg border border-dashed">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-bold">Configuración del Combo</h4>
            </div>

            <div className="space-y-3">
              <FormLabel>Productos Requeridos</FormLabel>
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedTargets
                  .filter((item) => item.__type === "bundle_product")
                  .map((p) => (
                    <Badge
                      key={p.id}
                      variant="secondary"
                      className="pl-2 pr-1 py-1 gap-1"
                    >
                      {p.name}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 rounded-full"
                        onClick={() => {
                          const newSelected = selectedTargets.filter(
                            (item) => item.id !== p.id,
                          );
                          setSelectedTargets(newSelected);
                          form.setValue(
                            "bundleConfig.requiredProductIds",
                            newSelected.map((i) => i.id),
                          );
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
              </div>

              <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    Añadir producto al combo...
                    <Search className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar por nombre o código..." />
                    <CommandList>
                      <CommandEmpty>No se encontraron productos.</CommandEmpty>
                      <CommandGroup>
                        {products
                          .filter(
                            (p) => !selectedTargets.find((s) => s.id === p.id),
                          )
                          .slice(0, 10)
                          .map((product) => (
                            <CommandItem
                              key={product.id}
                              value={product.name}
                              onSelect={() => {
                                const newSelected = [
                                  ...selectedTargets,
                                  { ...product, __type: "bundle_product" },
                                ];
                                setSelectedTargets(newSelected);
                                form.setValue(
                                  "bundleConfig.requiredProductIds",
                                  newSelected
                                    .filter(
                                      (i) => i.__type === "bundle_product",
                                    )
                                    .map((i) => i.id),
                                );
                                setSearchOpen(false);
                              }}
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {product.name}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {product.baseSku}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="bundleConfig.bundlePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio del Combo (S/)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                          value={field.value ?? 0}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bundleConfig.prorateStrategy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estrategia de Prorrateo</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Estrategia" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="proportional">
                            Proporcional
                          </SelectItem>
                          <SelectItem value="equal">Equitativo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        )}

        {watchType !== "bundle" && (
          <FormField
            control={form.control}
            name="scope"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alcance</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Alcance de la promoción" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="global">Todo el catálogo</SelectItem>
                    <SelectItem value="category">
                      Categoría específica
                    </SelectItem>
                    <SelectItem value="product_specific">
                      Productos específicos
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {form.watch("scope") === "category" && (
          <div className="space-y-3 p-4 bg-orange-500/5 rounded-lg border border-orange-500/20">
            <FormLabel>Categorías Aplicables</FormLabel>
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedTargets
                .filter((item) => item.__type === "category")
                .map((cat) => (
                  <Badge
                    key={cat.id}
                    variant="secondary"
                    className="pl-2 pr-1 py-1 gap-1"
                  >
                    {cat.name}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 rounded-full"
                      onClick={() => {
                        const newSelected = selectedTargets.filter(
                          (item) => item.id !== cat.id,
                        );
                        setSelectedTargets(newSelected);
                        form.setValue(
                          "targetIds",
                          newSelected
                            .filter((i) => i.__type === "category")
                            .map((i) => i.id),
                        );
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
            </div>

            <Popover
              open={categorySearchOpen}
              onOpenChange={setCategorySearchOpen}
            >
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  Seleccionar categorías...
                  <Search className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <CommandInput placeholder="Buscar categoría..." />
                  <CommandList>
                    <CommandEmpty>No se encontraron categorías.</CommandEmpty>
                    <CommandGroup>
                      {flatCategories
                        .filter(
                          (cat) =>
                            !selectedTargets.find((s) => s.id === cat.value),
                        )
                        .map((cat) => (
                          <CommandItem
                            key={cat.value}
                            value={cat.label}
                            onSelect={() => {
                              const categoryObj = categories.find(
                                (c) => c.id === cat.value,
                              );
                              if (categoryObj) {
                                const descendants = getDescendantIds(
                                  categoryObj.id,
                                  categories,
                                );
                                const allAffectedIds = [
                                  categoryObj.id,
                                  ...descendants,
                                ];
                                const newTargets = [
                                  ...selectedTargets,
                                  { ...categoryObj, __type: "category" },
                                ];
                                setSelectedTargets(newTargets);

                                const currentTargetIds =
                                  form.getValues("targetIds") || [];
                                const uniqueTargetIds = Array.from(
                                  new Set([
                                    ...currentTargetIds,
                                    ...allAffectedIds,
                                  ]),
                                );
                                form.setValue("targetIds", uniqueTargetIds);

                                toast.info(
                                  `Se incluyeron ${descendants.length} subcategorías automáticamente`,
                                );
                              }
                              setCategorySearchOpen(false);
                            }}
                          >
                            <div className="flex items-center">
                              <span style={{ width: cat.level * 16 }} />
                              {cat.level > 0 && (
                                <span className="text-muted-foreground mr-2">
                                  └─
                                </span>
                              )}
                              <span
                                className={cn(
                                  cat.level === 0 ? "font-bold" : "font-normal",
                                )}
                              >
                                {cat.label}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        )}

        {form.watch("scope") === "product_specific" && (
          <div className="space-y-3 p-4 bg-green-500/5 rounded-lg border border-green-500/20">
            <FormLabel>Productos Específicos</FormLabel>
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedTargets
                .filter((item) => item.__type === "product_target")
                .map((p) => (
                  <Badge
                    key={p.id}
                    variant="secondary"
                    className="pl-2 pr-1 py-1 gap-1"
                  >
                    {p.name}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 rounded-full"
                      onClick={() => {
                        const newSelected = selectedTargets.filter(
                          (item) => item.id !== p.id,
                        );
                        setSelectedTargets(newSelected);
                        form.setValue(
                          "targetIds",
                          newSelected
                            .filter((i) => i.__type === "product_target")
                            .map((i) => i.id),
                        );
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
            </div>

            <Popover open={searchOpen} onOpenChange={setSearchOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  Buscar productos...
                  <Search className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <CommandInput placeholder="Buscar por nombre o SKU..." />
                  <CommandList>
                    <CommandEmpty>No hay productos.</CommandEmpty>
                    <CommandGroup>
                      {products
                        .filter(
                          (p) => !selectedTargets.find((s) => s.id === p.id),
                        )
                        .slice(0, 10)
                        .map((product) => (
                          <CommandItem
                            key={product.id}
                            value={product.name}
                            onSelect={() => {
                              const newSelected = [
                                ...selectedTargets,
                                { ...product, __type: "product_target" },
                              ];
                              setSelectedTargets(newSelected);
                              form.setValue(
                                "targetIds",
                                newSelected
                                  .filter((i) => i.__type === "product_target")
                                  .map((i) => i.id),
                              );
                              setSearchOpen(false);
                            }}
                          >
                            <div className="flex flex-col">
                              <span>{product.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {product.baseSku}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        )}

        <FormField
          control={form.control}
          name="appliesTo"
          render={() => (
            <FormItem>
              <FormLabel>Aplica para:</FormLabel>
              <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name="appliesTo"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value.includes("venta")}
                          onCheckedChange={(checked) => {
                            return checked
                              ? field.onChange([...field.value, "venta"])
                              : field.onChange(
                                  field.value.filter(
                                    (val: string) => val !== "venta",
                                  ),
                                );
                          }}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Ventas</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="appliesTo"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value.includes("alquiler")}
                          onCheckedChange={(checked) => {
                            return checked
                              ? field.onChange([...field.value, "alquiler"])
                              : field.onChange(
                                  field.value.filter(
                                    (val: string) => val !== "alquiler",
                                  ),
                                );
                          }}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Alquileres</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-between items-center pt-4 border-t">
          <FormField
            control={form.control}
            name="isExclusive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value ?? true}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Exclusiva</FormLabel>
                  <FormDescription>No se acumula con otras.</FormDescription>
                </div>
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isSubmitting || isOverLimit}>
            {isSubmitting ? "Guardando..." : isEdit ? "Actualizar" : "Crear"}
          </Button>
        </div>

        {config?.pricing.allowDiscountStacking === false && (
          <Alert className="py-2 bg-blue-500/5 text-blue-500 border-blue-500/20">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              La configuración global prohíbe la acumulación de descuentos. Esta
              promoción será marcada como exclusiva.
            </AlertDescription>
          </Alert>
        )}

        {isOverLimit && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Supera el límite permitido ({maxAllowed}%).
            </AlertDescription>
          </Alert>
        )}
      </form>
    </Form>
  );
}
