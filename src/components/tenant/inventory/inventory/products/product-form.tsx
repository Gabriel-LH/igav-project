// components/inventory/ProductForm.tsx
"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
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
import { Badge } from "@/components/badge";
import { EntityModal, useEntityModal } from "../../catalogs/ui/EntityModal";
import {
  Plus,
  Package,
  DollarSign,
  CheckCircle2,
  Building2,
  FolderTree,
  Search,
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
import {
  getAttributeTypesAction,
  getAttributeValuesAction,
} from "@/src/app/(tenant)/tenant/actions/attribute.actions";
import {
  createBrandAction,
  createModelAction,
  getBrandsAction,
  getModelsAction,
} from "@/src/app/(tenant)/tenant/actions/brand.actions";
import {
  createCategoryAction,
  getCategoriesAction,
} from "@/src/app/(tenant)/tenant/actions/category.actions";
import { BrandForm } from "../../catalogs/brand/brand-form";
import { ModelForm } from "../../catalogs/model/model-form";
import { CategoryForm } from "../../catalogs/category/category-form";
import { toast } from "sonner";

const initialData: ProductFormData = {
  name: "",
  brandId: "",
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
  onSubmit: (data: ProductFormData) => boolean | void;
  onCreated?: () => void;
}

const getInitialFormData = (
  initialValues?: Partial<ProductFormData>,
): ProductFormData => ({
  ...initialData,
  ...initialValues,
  selectedAttributes: initialValues?.selectedAttributes || [],
  variantOverrides: initialValues?.variantOverrides || {},
});

export function ProductForm({
  initialValues,
  onSubmit,
  onCreated,
}: ProductFormProps) {
  const attributeTypes = useAttributeTypeStore((state) => state.attributeTypes);
  const attributeValues = useAttributeValueStore(
    (state) => state.attributeValues,
  );
  const setAttributeTypes = useAttributeTypeStore(
    (state) => state.setAttributeTypes,
  );
  const setAttributeValues = useAttributeValueStore(
    (state) => state.setAttributeValues,
  );
  const models = useModelStore((state) => state.models);
  const brands = useBrandStore((state) => state.brands);
  const categories = useCategoryStore((state) => state.categories);
  const setBrands = useBrandStore((state) => state.setBrands);
  const setModels = useModelStore((state) => state.setModels);
  const setCategories = useCategoryStore((state) => state.setCategories);
  const addBrand = useBrandStore((state) => state.addBrand);
  const addModel = useModelStore((state) => state.addModel);
  const addCategory = useCategoryStore((state) => state.addCategory);

  useEffect(() => {
    let isMounted = true;

    const loadAttributes = async () => {
      const [typesResult, valuesResult] = await Promise.all([
        getAttributeTypesAction(),
        getAttributeValuesAction(),
      ]);

      if (!isMounted) return;

      if (typesResult.success && typesResult.data) {
        setAttributeTypes(typesResult.data);
      }

      if (valuesResult.success && valuesResult.data) {
        setAttributeValues(valuesResult.data);
      }
    };

    void loadAttributes();

    return () => {
      isMounted = false;
    };
  }, [setAttributeTypes, setAttributeValues]);

  useEffect(() => {
    let isMounted = true;

    const loadCatalogs = async () => {
      const [brandsResult, modelsResult, categoriesResult] = await Promise.all([
        getBrandsAction(),
        getModelsAction(),
        getCategoriesAction(),
      ]);

      if (!isMounted) return;

      if (brandsResult.success && brandsResult.data) {
        setBrands(brandsResult.data);
      }
      if (modelsResult.success && modelsResult.data) {
        setModels(modelsResult.data);
      }
      if (categoriesResult.success && categoriesResult.data) {
        setCategories(categoriesResult.data);
      }
    };

    void loadCatalogs();

    return () => {
      isMounted = false;
    };
  }, [setBrands, setCategories, setModels]);

  const handleCreateBrand = async (data: Parameters<typeof createBrandAction>[0]) => {
    const result = await createBrandAction(data);
    if (result.success && result.data) {
      addBrand(result.data);
      setFormData((prev) => ({
        ...prev,
        brandId: result.data!.id,
        modelId: "",
      }));
      toast.success("Marca creada correctamente");
    } else {
      toast.error(result.error || "No se pudo crear la marca");
    }
  };

  const handleCreateModel = async (data: Parameters<typeof createModelAction>[0]) => {
    const result = await createModelAction(data);
    if (result.success && result.data) {
      addModel(result.data);
      setFormData((prev) => ({
        ...prev,
        brandId: result.data!.brandId,
        modelId: result.data!.id,
      }));
      toast.success("Modelo creado correctamente");
    } else {
      toast.error(result.error || "No se pudo crear el modelo");
    }
  };

  const handleCreateCategory = async (data: Parameters<typeof createCategoryAction>[0]) => {
    const result = await createCategoryAction(data);
    if (result.success && result.data) {
      addCategory(result.data);
      setFormData((prev) => ({
        ...prev,
        categoryId: result.data!.id,
      }));
      toast.success("Categoría creada correctamente");
    } else {
      toast.error(result.error || "No se pudo crear la categoría");
    }
  };

  const [formData, setFormData] = useState<ProductFormData>(
    getInitialFormData(initialValues),
  );

  const [activeTab, setActiveTab] = useState("general");
  const [openModelPopover, setOpenModelPopover] = useState(false);
  const [openBrandPopover, setOpenBrandPopover] = useState(false);

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

  const modelsByBrand = useMemo(() => {
    return models.filter((model) => model.brandId === formData.brandId);
  }, [models, formData.brandId]);

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

  const selectedBrand = brands.find((b) => b.id === formData.brandId);

  const resetAllOverrides = useCallback(() => {
    setFormData((prev) => ({ ...prev, variantOverrides: {} }));
  }, []);

  // Validaciones
  const canGoToAttributes =
    formData.baseSku && formData.name && formData.categoryId;

  const canGoToVariants =
    canGoToAttributes &&
    formData.selectedAttributes.length > 0 &&
    formData.selectedAttributes.every((a) => a.values.length > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const wasSuccessful = onSubmit(formData);
    if (!initialValues && wasSuccessful !== false) {
      setFormData(getInitialFormData(undefined));
      setActiveTab("general");
      onCreated?.();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="w-full flex justify-center">
          <TabsList>
            <TabsTrigger value="general" className="gap-2">
              <Package className="w-4 h-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="variants" className="gap-2">
              <DollarSign className="w-4 h-4" />
              Variantes
              {variants.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 text-[10px] h-4 px-1"
                >
                  {variants.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB 1: GENERAL */}
        <TabsContent value="general" className="space-y-6 mt-3">
          <div className="space-y-4">
            {/* FLAGS PRINCIPALES */}
            <div className="grid border-t pt-3 grid-cols-1 md:grid-cols-3 gap-4">
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

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-7">
              <div className="md:col-span-2">
                {/* INFO BÁSICA */}
                <div className="flex  w-full md:flex-row flex-col gap-4">
                  {/* NOMBRE PRIMERO */}
                  <div className="space-y-1 w-full md:col-span-2">
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
                  <div className="space-y-1 w-full">
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

                {/* SELECTOR DE CATEGORÍA JERÁRQUICO */}
                <div className="flex flex-row gap-4">
                  <div className="flex items-center align-middle w-full gap-4">
                    <div className="space-y-1 w-full">
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
                    <CategoryForm
                      categories={categories}
                      onSubmit={handleCreateCategory}
                      compact
                      trigger={
                        <Button variant="outline">
                          <Plus />
                          Crear
                        </Button>
                      }
                    />
                  </div>
                  <div className="flex mt-4 gap-4 w-full">
                    {/* INFO DE CATEGORÍA (breadcrumb) */}
                    {selectedCategory && (
                      <div className="px-3 h-fit py-1 bg-muted rounded-lg w-full">
                        <div className="text-sm text-muted-foreground">
                          Ruta de categoría
                        </div>
                        <div className="flex items-center gap-2 text-sm flex-wrap">
                          {selectedCategory.path
                            ?.split("/")
                            .map((part, idx, arr) => (
                              <span key={idx} className="flex items-center">
                                <span className="capitalize">{part}</span>
                                {idx < arr.length - 1 && (
                                  <span className="mx-2 text-muted-foreground">
                                    /
                                  </span>
                                )}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-1 mt-2">
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
                <div className="space-y-1 mt-2">
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
              </div>
              <div className="md:col-span-1">
                <div className="flex w-full gap-4 flex-col">
                  {/* SELECTOR DE MODELO (con Brand implícito) */}
                  <div className="flex items-center gap-4">
                    <div className="space-y-1 w-full">
                      <Label className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Marca (Opcional)
                      </Label>
                      <Popover
                        open={openBrandPopover}
                        onOpenChange={setOpenBrandPopover}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between"
                          >
                            {selectedBrand ? (
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {selectedBrand.name}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  {selectedBrand.name}
                                </Badge>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">
                                Seleccionar marca...
                              </span>
                            )}
                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0">
                          <Command>
                            <CommandInput placeholder="Buscar marca..." />
                            <CommandList>
                              <CommandEmpty>
                                No se encontraron marcas.
                              </CommandEmpty>
                              <CommandGroup>
                                {brands.map((brand) => (
                                  <CommandItem
                                    key={brand.id}
                                    onSelect={() => {
                                      setFormData({
                                        ...formData,
                                        brandId: brand.id,
                                      });
                                      setOpenBrandPopover(false);
                                    }}
                                    className="flex items-center justify-between"
                                  >
                                    <div>
                                      <div className="font-medium">
                                        {brand.name}
                                      </div>
                                    </div>
                                    <div
                                      className={cn(
                                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                        formData.brandId === brand.id
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
                    </div>

                    <BrandForm
                      onSubmit={handleCreateBrand}
                      compact
                      trigger={
                        <Button className="mt-5" variant="outline">
                          <Plus />
                          Crear
                        </Button>
                      }
                    />
                  </div>

                  <div className="flex gap-4">
                    <div className="space-y-1 w-full">
                      <Label className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Modelo (Opcional)
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
                              <CommandEmpty>
                                No se encontraron modelos.
                              </CommandEmpty>
                              <CommandGroup>
                                {modelsByBrand.map((model) => (
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
                                      <div className="font-medium">
                                        {model.name}
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
                    </div>
                    <ModelForm
                      brands={brands}
                      defaultBrandId={formData.brandId || undefined}
                      onSubmit={handleCreateModel}
                      compact
                      trigger={
                        <Button
                          className="mt-5"
                          variant="outline"
                          disabled={!formData.brandId}
                        >
                          <Plus />
                          Crear
                        </Button>
                      }
                    />
                  </div>
                </div>
              </div>

              {/* ATTRIBUTES */}
              <div className="w-full md:col-span-2">
                <VariantAttributeSelector
                  attributeTypes={attributeTypes}
                  attributeValues={attributeValues}
                  selectedAttributes={formData.selectedAttributes}
                  onChange={(attrs) =>
                    setFormData({ ...formData, selectedAttributes: attrs })
                  }
                />
                <div className="flex mt-3 justify-end">
                  <Button
                    type="button"
                    onClick={() => setActiveTab("variants")}
                    disabled={!canGoToVariants}
                  >
                    Generar {stats.total} Variantes
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB 3: VARIANTES */}
        <TabsContent value="variants" className="space-y-6">
          <VariantsTable
            baseSku={formData.baseSku}
            variants={variants}
            stats={stats}
            isSerial={formData.is_serial}
            canRent={formData.can_rent}
            canSell={formData.can_sell}
            onUpdateOverride={updateOverride}
            onResetOverride={resetOverride}
            onResetAll={resetAllOverrides}
          />

          <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveTab("general")}
            >
              Anterior
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
