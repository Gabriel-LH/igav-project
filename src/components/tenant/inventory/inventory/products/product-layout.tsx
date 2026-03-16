"use client";

import { useEffect, useState, useTransition } from "react";
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
  deleteProductAction,
  toggleVariantAction,
  updateProductAction,
  getProductByIdAction,
} from "@/src/app/(tenant)/tenant/actions/product.actions";
import { Product } from "@/src/types/product/type.product";
import { ProductVariant } from "@/src/types/product/type.productVariant";

export function ProductsLayout() {
  const [activeTab, setActiveTab] = useState("create");
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [editingProduct, setEditingProduct] = useState<{ product: Product; variants: ProductVariant[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

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

  useEffect(() => {
    fetchData();
  }, []);

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
          <ProductForm
            initialValues={editingProduct ? {
              ...editingProduct.product,
              modelId: editingProduct.product.modelId ?? undefined,
              categoryId: editingProduct.product.categoryId ?? undefined,
              variantOverrides: editingProduct.variants.reduce((acc, v) => ({
                ...acc,
                [v.variantSignature]: v as unknown as any
              }), {})
            } : undefined}
            onSubmit={handleSubmit}
            onCreated={() => {
              setEditingProduct(null);
              setActiveTab("table");
            }}
          />
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
