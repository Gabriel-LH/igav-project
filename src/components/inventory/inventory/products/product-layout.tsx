"use client";

import { useMemo } from "react";
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

export function ProductsLayout() {
  const tenantId = "tenant-a";
  const userId = "admin";
  const products = useInventoryStore((state) => state.products);
  const productVariants = useInventoryStore((state) => state.productVariants);
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

  const activeProducts = useMemo(
    () => products.filter((product) => !product.isDeleted),
    [products],
  );

  const handleSubmit = (formData: ProductFormData) => {
    createProductWithVariantsUseCase.execute({
      tenantId,
      userId,
      formData,
    });
  };

  const handleDeleteProduct = (productId: string) => {
    softDeleteProductUseCase.execute({ productId, deletedBy: userId });
  };

  const handleToggleVariant = (variantId: string, isActive: boolean) => {
    toggleProductVariantUseCase.execute({ variantId, isActive });
  };

  return (
    <div className="space-y-6">
      <ProductForm onSubmit={handleSubmit} />
      <ProductTable
        products={activeProducts}
        variants={productVariants}
        onDeleteProduct={handleDeleteProduct}
        onToggleVariant={handleToggleVariant}
      />
    </div>
  );
}
