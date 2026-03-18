"use server";

import crypto from "crypto";

import { PrismaProductAdapter } from "@/src/infrastructure/tenant/stores-adapters/prisma-product.adapter";
import { CreateProductWithVariantsUseCase } from "@/src/application/tenant/use-cases/inventory/createProductWithVariants.usecase";
import { ListProductsWithVariantsUseCase } from "@/src/application/tenant/use-cases/inventory/listProductsWithVariants.usecase";
import { SoftDeleteProductUseCase, ToggleProductVariantUseCase, UpdateVariantUseCase, CreateVariantUseCase } from "@/src/application/tenant/use-cases/inventory/manageProductVariants.usecase";
import { GetProductByIdUseCase } from "@/src/application/tenant/use-cases/inventory/getProductById.usecase";
import { UpdateProductWithVariantsUseCase } from "@/src/application/tenant/use-cases/inventory/updateProductWithVariants.usecase";
import { requireTenantMembership } from "@/src/infrastructure/tenant/auth.guard";
import { ProductFormData } from "@/src/application/interfaces/ProductForm";
import { ProductVariant } from "@/src/types/product/type.productVariant";
import { revalidatePath } from "next/cache";
import { getAttributeTypesAction, getAttributeValuesAction } from "@/src/app/(tenant)/tenant/actions/attribute.actions";
import { getBrandsAction, getModelsAction } from "@/src/app/(tenant)/tenant/actions/brand.actions";
import { getCategoriesAction } from "@/src/app/(tenant)/tenant/actions/category.actions";
import { Brand } from "@/src/types/brand/type.brand";
import { Model } from "@/src/types/model/type.model";
import { Category } from "@/src/types/category/type.category";
import { AttributeType } from "@/src/types/attributes/type.attribute-type";
import { AttributeValue } from "@/src/types/attributes/type.attribute-value";
import { Product } from "@/src/types/product/type.product";

/**
 * Acciones para la gestión de productos y variantes.
 * Sigue el patrón: Guard → Repository → UseCase → Revalidate.
 */

export type ProductsBootstrapData = {
  products: Product[];
  variants: ProductVariant[];
  brands: Brand[];
  models: Model[];
  categories: Category[];
  attributeTypes: AttributeType[];
  attributeValues: AttributeValue[];
};

export async function getProductsBootstrapAction() {
  try {
    const [
      productsResult,
      brandsResult,
      modelsResult,
      categoriesResult,
      attributeTypesResult,
      attributeValuesResult,
    ] = await Promise.all([
      getProductsAction(),
      getBrandsAction(),
      getModelsAction(),
      getCategoriesAction(),
      getAttributeTypesAction(),
      getAttributeValuesAction(),
    ]);

    const firstError =
      (!productsResult.success && productsResult.error) ||
      (!brandsResult.success && brandsResult.error) ||
      (!modelsResult.success && modelsResult.error) ||
      (!categoriesResult.success && categoriesResult.error) ||
      (!attributeTypesResult.success && attributeTypesResult.error) ||
      (!attributeValuesResult.success && attributeValuesResult.error) ||
      "No se pudo cargar el inventario base";

    if (
      !productsResult.success ||
      !brandsResult.success ||
      !modelsResult.success ||
      !categoriesResult.success ||
      !attributeTypesResult.success ||
      !attributeValuesResult.success
    ) {
      return { success: false, error: firstError };
    }

    return {
      success: true,
      data: {
        products: productsResult.data?.products ?? [],
        variants: productsResult.data?.variants ?? [],
        brands: brandsResult.data ?? [],
        models: modelsResult.data ?? [],
        categories: categoriesResult.data ?? [],
        attributeTypes: attributeTypesResult.data ?? [],
        attributeValues: attributeValuesResult.data ?? [],
      } satisfies ProductsBootstrapData,
    };
  } catch (error) {
    console.error("Error al cargar inventario base:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al cargar inventario base",
    };
  }
}

export async function createProductAction(formData: ProductFormData) {
  try {
    const membership = await requireTenantMembership();
    const { tenantId, user } = membership;

    if (!tenantId) throw new Error("Tenant ID es obligatorio");

    const productRepo = new PrismaProductAdapter();
    const createUseCase = new CreateProductWithVariantsUseCase(productRepo);

    const result = await createUseCase.execute({
      tenantId,
      userId: user.id!,
      formData,
    });

    revalidatePath("/tenant/inventory/inventory/products");
    return { success: true, data: result };
  } catch (error) {
    console.error("Error al crear producto:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido al crear producto",
    };
  }
}

export async function getProductsAction(filters?: { onlySerializable?: boolean }) {
  try {
    const membership = await requireTenantMembership();
    const { tenantId } = membership;

    if (!tenantId) throw new Error("Tenant ID es obligatorio");

    const productRepo = new PrismaProductAdapter();
    const listUseCase = new ListProductsWithVariantsUseCase(productRepo);

    const result = await listUseCase.execute({
      tenantId,
      onlySerializable: filters?.onlySerializable,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Error al obtener productos:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido al obtener productos",
    };
  }
}

export async function getProductByIdAction(productId: string) {
  try {
    const membership = await requireTenantMembership();
    const { tenantId } = membership;

    if (!tenantId) throw new Error("Tenant ID es obligatorio");

    const productRepo = new PrismaProductAdapter();
    const getUseCase = new GetProductByIdUseCase(productRepo);

    const result = await getUseCase.execute({ tenantId, productId });

    return { success: true, data: result };
  } catch (error) {
    console.error("Error al obtener producto por ID:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido al obtener el producto",
    };
  }
}

export async function updateProductAction(productId: string, formData: ProductFormData) {
  try {
    const membership = await requireTenantMembership();
    const { tenantId, user } = membership;

    if (!tenantId) throw new Error("Tenant ID es obligatorio");

    const productRepo = new PrismaProductAdapter();
    const updateUseCase = new UpdateProductWithVariantsUseCase(productRepo);

    await updateUseCase.execute({
      tenantId,
      productId,
      userId: user.id!,
      formData,
    });

    revalidatePath("/tenant/inventory/inventory/products");
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido al actualizar producto",
    };
  }
}

export async function deleteProductAction(productId: string) {
  try {
    const membership = await requireTenantMembership();
    const { user } = membership;

    const productRepo = new PrismaProductAdapter();
    const deleteUseCase = new SoftDeleteProductUseCase(productRepo);

    await deleteUseCase.execute({ productId, deletedBy: user.id! });

    revalidatePath("/tenant/inventory/inventory/products");
    return { success: true };
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido al eliminar producto",
    };
  }
}

export async function toggleVariantAction(variantId: string, isActive: boolean) {
  try {
    await requireTenantMembership();

    const productRepo = new PrismaProductAdapter();
    const toggleUseCase = new ToggleProductVariantUseCase(productRepo);

    await toggleUseCase.execute({ variantId, isActive });

    revalidatePath("/tenant/inventory/inventory/products");
    return { success: true };
  } catch (error) {
    console.error("Error al activar/desactivar variante:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido al modificar variante",
    };
  }
}

export async function updateVariantAction(variantId: string, updates: Partial<ProductVariant>) {
  try {
    await requireTenantMembership();

    const productRepo = new PrismaProductAdapter();
    const updateUseCase = new UpdateVariantUseCase(productRepo);

    await updateUseCase.execute({ 
      variantId, 
      updates: updates as any 
    });

    revalidatePath("/tenant/inventory/inventory/products");
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar variante:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido al actualizar variante",
    };
  }
}

export async function createVariantAction(productId: string, variantData: Partial<ProductVariant>) {
  try {
    const membership = await requireTenantMembership();
    const { tenantId } = membership;

    if (!tenantId) throw new Error("Tenant ID es obligatorio");

    const productRepo = new PrismaProductAdapter();
    const createUseCase = new CreateVariantUseCase(productRepo);

    // Generar ID si no existe
    const variantId = `variant-${crypto.randomUUID()}`;

    await createUseCase.execute({
      variants: [{
        ...variantData,
        id: variantId,
        productId,
        tenantId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }]
    });

    revalidatePath("/tenant/inventory/inventory/products");
    return { success: true };
  } catch (error) {
    console.error("Error al crear variante:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido al crear variante",
    };
  }
}
