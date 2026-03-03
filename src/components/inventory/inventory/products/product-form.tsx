// components/inventory/ProductForm.tsx
"use client";

import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/badge";
import { EntityModal, useEntityModal } from "../../catalogs/ui/EntityModal";
import {
  Plus,
  Package,
  Layers,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Building2,
  FolderTree,
  Search,
  Hash,
  RefreshCcwIcon,
} from "lucide-react";
import { VariantAttributeSelector } from "./selected-atribute";
import { VariantsTable } from "./table/variant-table";
import { useVariantGenerator } from "@/src/utils/variants/useVariantGenarate";
import {
  ProductFormData,
  VariantOverride,
} from "@/src/application/interfaces/ProductForm";
import {
  buildCategoryTree,
  flattenCategories,
} from "@/src/utils/category/categoryTree";
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
import { cn } from "@/lib/utils";
import { useAttributeTypeStore } from "@/src/store/useAttributeTypeStore";
import { useAttributeValueStore } from "@/src/store/useAttributeValueStore";
import { useModelStore } from "@/src/store/useModelStore";
import { useBrandStore } from "@/src/store/useBrandStore";
import { useCategoryStore } from "@/src/store/useCategoryStore";

const initialData: ProductFormData = {
  name: "",
  baseSku: "",
  modelId: "",
  categoryId: "",
  description: "",
  image: "",
  can_rent: true,
  can_sell: true,
  is_serial: true,
  selectedAttributes: [],
  variantOverrides: {},
};

interface ProductFormProps {
  initialValues?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => void;
}

export function ProductForm({ initialValues, onSubmit }: ProductFormProps) {
  const attributeTypes = useAttributeTypeStore((state) => state.attributeTypes);
  const attributeValues = useAttributeValueStore(
    (state) => state.attributeValues,
  );
  const models = useModelStore((state) => state.models);
  const brands = useBrandStore((state) => state.brands);
  const categories = useCategoryStore((state) => state.categories);

  const [formData, setFormData] = useState<ProductFormData>({
    ...initialData,
    ...initialValues,
    selectedAttributes: initialValues?.selectedAttributes || [],
    variantOverrides: initialValues?.variantOverrides || {},
  });

  const [activeTab, setActiveTab] = useState("general");
  const [openModelPopover, setOpenModelPopover] = useState(false);

  // Preparar datos para selectores
  const modelOptions = useMemo(() => {
    return models
      .filter((model) => model.isActive)
      .map((model) => {
        const brand = brands.find(
          (brandItem) => brandItem.id === model.brandId,
        );
        return {
          id: model.id,
          name: model.name,
          brandName: brand?.name || "Sin marca",
          brandId: model.brandId,
        };
      });
  }, [brands, models]);

  const categoryTree = useMemo(() => {
    return buildCategoryTree(
      categories.filter((category) => category.isActive),
    );
  }, [categories]);

  const flatCategories = useMemo(() => {
    return flattenCategories(
      categories.filter((category) => category.isActive),
    );
  }, [categories]);

  // Encontrar seleccionados para mostrar info
  const selectedModel = modelOptions.find((m) => m.id === formData.modelId);
  const selectedCategory = categories.find((c) => c.id === formData.categoryId);

  const { variants, stats } = useVariantGenerator(
    formData.baseSku,
    formData.selectedAttributes,
    formData.variantOverrides,
    formData.can_rent,
    formData.can_sell,
  );

  const updateOverride = useCallback(
    (signature: string, override: Partial<VariantOverride>) => {
      setFormData((prev) => ({
        ...prev,
        variantOverrides: {
          ...prev.variantOverrides,
          [signature]: {
            ...prev.variantOverrides[signature],
            ...override,
            variantSignature: signature,
            isEdited: true,
          },
        },
      }));
    },
    [],
  );

  const resetOverride = useCallback((signature: string) => {
    setFormData((prev) => {
      const { [signature]: _, ...rest } = prev.variantOverrides;
      return { ...prev, variantOverrides: rest };
    });
  }, []);

  const resetAllOverrides = useCallback(() => {
    setFormData((prev) => ({ ...prev, variantOverrides: {} }));
  }, []);

  // Validaciones
  const canGoToAttributes =
    formData.baseSku &&
    formData.name &&
    formData.modelId &&
    formData.categoryId;
  const canGoToVariants =
    canGoToAttributes &&
    formData.selectedAttributes.length > 0 &&
    formData.selectedAttributes.every((a) => a.values.length > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general" className="gap-2">
            <Package className="w-4 h-4" />
            General
          </TabsTrigger>
          <TabsTrigger
            value="attributes"
            className="gap-2"
            disabled={!canGoToAttributes}
          >
            <Layers className="w-4 h-4" />
            Atributos
            {formData.selectedAttributes.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1">
                {formData.selectedAttributes.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="variants"
            className="gap-2"
            disabled={!canGoToVariants}
          >
            <DollarSign className="w-4 h-4" />
            Variantes
            {variants.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1">
                {variants.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: GENERAL */}
        <TabsContent value="general" className="space-y-6 mt-3">
          <div className="space-y-4">
            {/* FLAGS PRINCIPALES */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card
                className={`border transition-colors ${
                  formData.can_rent
                    ? "border-blue-500 bg-blue-50/10"
                    : "border-muted"
                }`}
              >
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-base font-semibold flex items-center -mt-3">
                        Disponible para Renta
                        {formData.can_rent && (
                          <CheckCircle2 className="w-4 h-4 text-blue-500" />
                        )}
                      </Label>
                      <p className="text-xs text-muted-foreground mb-1">
                        Los clientes pueden rentar este producto por tiempo
                      </p>
                    </div>
                    <Switch
                      checked={formData.can_rent}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, can_rent: checked })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`border transition-colors ${
                  formData.can_sell
                    ? "border-green-500 bg-green-50/10"
                    : "border-muted"
                }`}
              >
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-base font-semibold flex items-center -mt-3">
                        Disponible para Venta
                        {formData.can_sell && (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        )}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Los clientes pueden comprar este producto
                      </p>
                    </div>
                    <Switch
                      checked={formData.can_sell}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, can_sell: checked })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`border transition-colors ${
                  formData.is_serial
                    ? "border-amber-500 bg-amber-50/10"
                    : "border-muted"
                }`}
              >
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-base font-semibold flex items-center -mt-3">
                        Ítems Serializados
                        {formData.is_serial && (
                          <CheckCircle2 className="w-4 h-4 text-amber-500" />
                        )}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Cada unidad tiene número de serie único
                      </p>
                    </div>
                    <Switch
                      checked={formData.is_serial}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_serial: checked })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* INFO BÁSICA */}
            <div className="flex  w-full md:flex-row flex-col gap-4">
              {/* NOMBRE PRIMERO */}
              <div className="space-y-2 w-full md:col-span-2">
                <Label htmlFor="name">Nombre del Producto *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="iPhone 15 Pro"
                />
              </div>

              {/* SKU BASE CON BOTÓN GENERAR */}
              <div className="space-y-2 w-full">
                <Label htmlFor="baseSku">SKU Base *</Label>
                <div className="flex gap-2">
                  <Input
                    id="baseSku"
                    value={formData.baseSku}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        baseSku: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="IPH-15-PRO"
                    className="font-mono flex-1"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      // Generar SKU base: 3 primeras letras del nombre
                      const nameWords = formData.name.trim().split(/\s+/);
                      let sku = "";

                      if (nameWords.length === 1) {
                        // Una palabra: primeras 3 letras
                        sku = nameWords[0].substring(0, 3).toUpperCase();
                      } else {
                        // Múltiples palabras: primera letra de cada una (max 4)
                        sku = nameWords
                          .slice(0, 4)
                          .map((w) => w[0]?.toUpperCase() || "")
                          .join("");
                      }

                      // Agregar timestamp corto para unicidad si está vacío
                      if (!sku) sku = "PROD";

                      setFormData({ ...formData, baseSku: sku });
                    }}
                    disabled={!formData.name}
                    className="gap-2 whitespace-nowrap"
                  >
                    <RefreshCcwIcon className="w-4 h-4" />
                    Generar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Prefijo para SKUs de variantes. Ej:{" "}
                  {formData.baseSku || "XXX"}-NEG-M-01
                </p>
              </div>
            </div>

            <div className="flex w-full gap-4 md:flex-row flex-col">
              {/* SELECTOR DE MODELO (con Brand implícito) */}
              <div className="space-y-2 w-full">
                <Label className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Modelo *
                </Label>
                <Popover
                  open={openModelPopover}
                  onOpenChange={setOpenModelPopover}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {selectedModel ? (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {selectedModel.name}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {selectedModel.brandName}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">
                          Seleccionar modelo...
                        </span>
                      )}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar modelo..." />
                      <CommandList>
                        <CommandEmpty>No se encontraron modelos.</CommandEmpty>
                        <CommandGroup>
                          {modelOptions.map((model) => (
                            <CommandItem
                              key={model.id}
                              onSelect={() => {
                                setFormData({
                                  ...formData,
                                  modelId: model.id,
                                });
                                setOpenModelPopover(false);
                              }}
                              className="flex items-center justify-between"
                            >
                              <div>
                                <div className="font-medium">{model.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {model.brandName}
                                </div>
                              </div>
                              <div
                                className={cn(
                                  "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                  formData.modelId === model.id
                                    ? "bg-primary text-primary-foreground"
                                    : "opacity-50 [&_svg]:invisible",
                                )}
                              >
                                <CheckCircle2 className="h-3 w-3" />
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">
                  La marca se determina automáticamente del modelo seleccionado
                </p>
              </div>

              {/* SELECTOR DE CATEGORÍA JERÁRQUICO */}
              <div className="space-y-2 w-full">
                <Label className="flex items-center gap-2">
                  <FolderTree className="w-4 h-4" />
                  Categoría *
                </Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(val) =>
                    setFormData({ ...formData, categoryId: val })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar categoría..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {flatCategories.map((cat) => (
                      <SelectItem
                        key={cat.value}
                        value={cat.value}
                        disabled={cat.disabled}
                      >
                        <div className="flex items-center">
                          <span style={{ width: cat.level * 20 }} />
                          {cat.level > 0 && (
                            <span className="text-muted-foreground mr-2">
                              └─
                            </span>
                          )}
                          <span
                            className={cn(
                              cat.disabled && "text-muted-foreground",
                            )}
                          >
                            {cat.label}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Selecciona la categoría más específica (último nivel)
                </p>
              </div>
            </div>

            {/* INFO DE MARCA (solo lectura) */}
            {selectedModel && (
              <div className="p-3 bg-muted rounded-lg flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {selectedModel.brandName[0]}
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Marca</div>
                  <div className="font-semibold">{selectedModel.brandName}</div>
                </div>
              </div>
            )}

            {/* INFO DE CATEGORÍA (breadcrumb) */}
            {selectedCategory && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">
                  Ruta de categoría
                </div>
                <div className="flex items-center gap-2 text-sm flex-wrap">
                  {selectedCategory.path?.split("/").map((part, idx, arr) => (
                    <span key={idx} className="flex items-center">
                      <span className="capitalize">{part}</span>
                      {idx < arr.length - 1 && (
                        <span className="mx-2 text-muted-foreground">/</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Descripción detallada del producto..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">URL de Imagen</Label>
              <Input
                id="image"
                value={formData.image}
                onChange={(e) =>
                  setFormData({ ...formData, image: e.target.value })
                }
                placeholder="https://..."
              />
            </div>

            {!canGoToAttributes && (
              <Alert variant="default" className="bg-muted/50 mb-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Completa SKU, Nombre, Modelo y Categoría para continuar.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              onClick={() => setActiveTab("attributes")}
              disabled={!canGoToAttributes}
            >
              Siguiente: Configurar Atributos
            </Button>
          </div>
        </TabsContent>

        {/* TAB 2: ATRIBUTOS */}
        <TabsContent value="attributes" className="space-y-6 mt-6">
          <VariantAttributeSelector
            attributeTypes={attributeTypes}
            attributeValues={attributeValues}
            selectedAttributes={formData.selectedAttributes}
            onChange={(attrs) =>
              setFormData({ ...formData, selectedAttributes: attrs })
            }
          />
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveTab("general")}
            >
              Anterior
            </Button>
            <Button
              type="button"
              onClick={() => setActiveTab("variants")}
              disabled={!canGoToVariants}
            >
              Generar {stats.total} Variantes
            </Button>
          </div>
        </TabsContent>

        {/* TAB 3: VARIANTES */}
        <TabsContent value="variants" className="space-y-6 mt-6">
          <VariantsTable
            baseSku={formData.baseSku}
            variants={variants}
            stats={stats}
            isSerial={formData.is_serial}
            onUpdateOverride={updateOverride}
            onResetOverride={resetOverride}
            onResetAll={resetAllOverrides}
          />

          <div className="flex justify-between items-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveTab("attributes")}
            >
              Anterior: Modificar Atributos
            </Button>

            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground text-right">
                <div>{stats.active} variantes activas</div>
                <div>
                  {Object.keys(formData.variantOverrides).length} personalizadas
                </div>
              </div>
              <Button type="submit" size="lg" className="gap-2">
                <Plus className="w-4 h-4" />
                {initialValues ? "Guardar Cambios" : "Crear Producto"}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </form>
  );
}

// Modal Trigger actualizado
export function ProductModalTrigger() {
  const { open, setOpen, isEditing } = useEntityModal();

  return (
    <EntityModal
      title={isEditing ? "Editar Producto" : "Nuevo Producto"}
      description="Crea un producto con modelo, categoría y variantes."
      open={open}
      onOpenChange={setOpen}
      maxWidth="full"
      trigger={
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Producto
        </Button>
      }
    >
      <ProductForm
        onSubmit={(data) => {
          console.log("✅ PRODUCTO FINAL:", {
            ...data,
            // El backend usará modelId para obtener brandId
            // y categoryId para obtener la jerarquía completa
          });
          setOpen(false);
        }}
      />
    </EntityModal>
  );
}
