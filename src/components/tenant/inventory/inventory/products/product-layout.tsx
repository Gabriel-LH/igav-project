"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { ProductForm } from "./product-form";
import { ProductTable } from "./product-table";
import { ProductFormData } from "@/src/application/interfaces/ProductForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { AddToListIcon } from "@hugeicons/core-free-icons";
import {
  createProductAction,
  getProductsAction,
  getProductsBootstrapAction,
  deleteProductAction,
  toggleVariantAction,
  updateProductAction,
  getProductByIdAction,
} from "@/src/app/(tenant)/tenant/actions/product.actions";
import { Product } from "@/src/types/product/type.product";
import { ProductVariant } from "@/src/types/product/type.productVariant";
import { useAttributeTypeStore } from "@/src/store/useAttributeTypeStore";
import { useAttributeValueStore } from "@/src/store/useAttributeValueStore";
import { useModelStore } from "@/src/store/useModelStore";
import { reconstructSelectedAttributes } from "@/src/utils/variants/reconstructSelectedAttributes";
import type { ProductsBootstrapData } from "@/src/app/(tenant)/tenant/actions/product.actions";

let cachedBootstrapData: ProductsBootstrapData | null = null;
let bootstrapPromise: Promise<
  { success: true; data: ProductsBootstrapData } | { success: false; error: string }
> | null = null;

export function ProductsLayout() {
  const [activeTab, setActiveTab] = useState("create");
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [bootstrapData, setBootstrapData] = useState<ProductsBootstrapData | null>(null);
  const [editingProduct, setEditingProduct] = useState<{ product: Product; variants: ProductVariant[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Stores needed for reconstructing selectedAttributes and brandId
  const attributeTypes = useAttributeTypeStore((s) => s.attributeTypes);
  const attributeValues = useAttributeValueStore((s) => s.attributeValues);
  const models = useModelStore((s) => s.models);
  const setAttributeTypes = useAttributeTypeStore((s) => s.setAttributeTypes);
  const setAttributeValues = useAttributeValueStore((s) => s.setAttributeValues);
  const setModels = useModelStore((s) => s.setModels);

  const fetchData = async () => {
    setIsLoading(true);
    const result = await getProductsAction();
    if (result.success && result.data) {
      setProducts(result.data.products);
      setVariants(result.data.variants);
    } else {
      toast.error(result.error || "Error al cargar productos");
    }
    setIsLoading(false);
  };

  const fetchBootstrap = useCallback(async () => {
    setIsLoading(true);
    if (cachedBootstrapData) {
      setProducts(cachedBootstrapData.products);
      setVariants(cachedBootstrapData.variants);
      setBootstrapData(cachedBootstrapData);
      setAttributeTypes(cachedBootstrapData.attributeTypes);
      setAttributeValues(cachedBootstrapData.attributeValues);
      setModels(cachedBootstrapData.models);
      setIsLoading(false);
      return;
    }

    if (!bootstrapPromise) {
      bootstrapPromise = getProductsBootstrapAction();
    }

    const result = await bootstrapPromise;
    if (result.success && result.data) {
      cachedBootstrapData = result.data;
      setProducts(result.data.products);
      setVariants(result.data.variants);
      setBootstrapData(result.data);
      setAttributeTypes(result.data.attributeTypes);
      setAttributeValues(result.data.attributeValues);
      setModels(result.data.models);
    } else {
      toast.error(result.error || "Error al cargar productos");
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchBootstrap();
  }, [fetchBootstrap]);

  const handleSubmit = async (formData: ProductFormData): Promise<boolean> => {
    let success = false;
    startTransition(async () => {
      const result = editingProduct 
        ? await updateProductAction(editingProduct.product.id, formData)
        : await createProductAction(formData);

      if (result.success) {
        toast.success(editingProduct ? "Producto actualizado" : "Producto creado correctamente");
        setEditingProduct(null);
        setActiveTab("table");
        fetchData();
        success = true;
      } else {
        toast.error(result.error || "No se pudo procesar el producto");
      }
    });
    return success;
  };

  const handleEditProduct = async (productId: string) => {
    setIsLoading(true);
    const result = await getProductByIdAction(productId);
    if (result.success && result.data) {
      setEditingProduct(result.data);
      setActiveTab("create");
    } else {
      toast.error(result.error || "No se pudo cargar el producto para editar");
    }
    setIsLoading(false);
  };

  const handleDeleteProduct = async (productId: string) => {
    startTransition(async () => {
      const result = await deleteProductAction(productId);
      if (result.success) {
        toast.success("Producto eliminado");
        fetchData();
      } else {
        toast.error(result.error || "No se pudo eliminar el producto");
      }
    });
  };

  const handleToggleVariant = async (variantId: string, isActive: boolean) => {
    startTransition(async () => {
      const result = await toggleVariantAction(variantId, isActive);
      if (result.success) {
        fetchData();
      } else {
        toast.error(result.error || "No se pudo modificar la variante");
      }
    });
  };

  return (
    <div className="space-y-6 w-full max-w-full min-w-0">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between gap-4">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="create" className="gap-2">
              <HugeiconsIcon icon={AddToListIcon} />
              Crear Producto
            </TabsTrigger>
            <TabsTrigger value="table" className="gap-2">
              <Table2 className="w-4 h-4" />
              Todos los Productos
            </TabsTrigger>
          </TabsList>
          {(isLoading || isPending) && (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>

        <TabsContent value="create" className="mt-4 w-full max-w-full min-w-0 overflow-hidden">
          {!bootstrapData ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Cargando catálogos...
            </div>
          ) : (
            <ProductForm
              initialValues={editingProduct ? (() => {
                // Reconstruct selectedAttributes from existing variants
                const reconstructedAttrs = reconstructSelectedAttributes(
                  editingProduct.variants,
                  bootstrapData.attributeTypes,
                  bootstrapData.attributeValues,
                );

                // Resolve brandId from the model
                const resolvedBrandId = editingProduct.product.modelId
                  ? bootstrapData.models.find(m => m.id === editingProduct.product.modelId)?.brandId
                  : undefined;

                return {
                  ...editingProduct.product,
                  brandId: resolvedBrandId,
                  modelId: editingProduct.product.modelId ?? undefined,
                  categoryId: editingProduct.product.categoryId ?? undefined,
                  selectedAttributes: reconstructedAttrs,
                  variantOverrides: editingProduct.variants.reduce((acc, v) => ({
                    ...acc,
                    [v.variantSignature]: {
                      variantSignature: v.variantSignature,
                      variantCode: v.variantCode,
                      barcode: v.barcode,
                      priceRent: v.priceRent,
                      priceSell: v.priceSell,
                      purchasePrice: v.purchasePrice,
                      rentUnit: v.rentUnit,
                      isActive: v.isActive,
                      images: v.image,
                      isEdited: true, // marca como override existente
                    },
                  }), {}),
                };
              })() : undefined}
              initialCatalogs={{
                brands: bootstrapData.brands,
                models: bootstrapData.models,
                categories: bootstrapData.categories,
              }}
              initialAttributes={{
                attributeTypes: bootstrapData.attributeTypes,
                attributeValues: bootstrapData.attributeValues,
              }}
              onSubmit={handleSubmit}
              onCreated={() => {
                setEditingProduct(null);
                setActiveTab("table");
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="table" className="mt-4">
          <ProductTable
            products={products}
            variants={variants}
            onDeleteProduct={handleDeleteProduct}
            onToggleVariant={handleToggleVariant}
            onEditProduct={handleEditProduct}
            onRefresh={fetchData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
