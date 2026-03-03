"use client";

import { useMemo, useState } from "react";
import { ProductForm } from "./product-form";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { ZustandInventoryRepository } from "@/src/infrastructure/stores-adapters/ZustandInventoryRepository";
import { CreateProductWithVariantsUseCase } from "@/src/application/use-cases/inventory/createProductWithVariants.usecase";
import {
  SoftDeleteProductUseCase,
  ToggleProductVariantUseCase,
} from "@/src/application/use-cases/inventory/manageProductVariants.usecase";
import { ProductTable } from "./product-table";
import { ProductFormData } from "@/src/application/interfaces/ProductForm";
import { ListProductsWithVariantsUseCase } from "@/src/application/use-cases/inventory/listProductsWithVariants.usecase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Table2 } from "lucide-react";
import { toast } from "sonner";

export function ProductsLayout() {
  const tenantId = "tenant-a";
  const userId = "admin";
  const productsState = useInventoryStore((state) => state.products);
  const variantsState = useInventoryStore((state) => state.productVariants);
  const inventoryRepo = useMemo(() => new ZustandInventoryRepository(), []);
  const createProductWithVariantsUseCase = useMemo(
    () => new CreateProductWithVariantsUseCase(inventoryRepo),
    [inventoryRepo],
  );
  const softDeleteProductUseCase = useMemo(
    () => new SoftDeleteProductUseCase(inventoryRepo),
    [inventoryRepo],
  );
  const toggleProductVariantUseCase = useMemo(
    () => new ToggleProductVariantUseCase(inventoryRepo),
    [inventoryRepo],
  );
  const listProductsWithVariantsUseCase = useMemo(
    () => new ListProductsWithVariantsUseCase(inventoryRepo),
    [inventoryRepo],
  );

  const { products: activeProducts, variants: productVariants } = useMemo(
    () =>
      listProductsWithVariantsUseCase.execute({
        includeDeleted: false,
      }),
    [listProductsWithVariantsUseCase, productsState, variantsState],
  );
  const [activeTab, setActiveTab] = useState("create");

  const handleSubmit = (formData: ProductFormData): boolean => {
    try {
      createProductWithVariantsUseCase.execute({
        tenantId,
        userId,
        formData,
      });
      toast.success("Producto creado correctamente");
      setActiveTab("table");
      return true;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo crear el producto",
      );
      return false;
    }
  };

  const handleDeleteProduct = (productId: string) => {
    softDeleteProductUseCase.execute({ productId, deletedBy: userId });
  };

  const handleToggleVariant = (variantId: string, isActive: boolean) => {
    toggleProductVariantUseCase.execute({ variantId, isActive });
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="create" className="gap-2">
            <Package className="w-4 h-4" />
            Crear Producto
          </TabsTrigger>
          <TabsTrigger value="table" className="gap-2">
            <Table2 className="w-4 h-4" />
            Todos los Productos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="mt-4">
          <ProductForm
            onSubmit={handleSubmit}
            onCreated={() => setActiveTab("table")}
          />
        </TabsContent>

        <TabsContent value="table" className="mt-4">
          <ProductTable
            products={activeProducts}
            variants={productVariants}
            onDeleteProduct={handleDeleteProduct}
            onToggleVariant={handleToggleVariant}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
