import { ProductFormData } from "../../../interfaces/ProductForm";
import { InventoryRepository } from "../../../../domain/tenant/repositories/InventoryRepository";
import { Product } from "../../../../types/product/type.product";
import { ProductVariant } from "../../../../types/product/type.productVariant";
import { buildVariantsFromProductForm } from "../../../../utils/variants/buildVariantsFromForm";

interface CreateProductWithVariantsInput {
  tenantId: string;
  userId: string;
  formData: ProductFormData;
}

interface CreateProductWithVariantsOutput {
  product: Product;
  variants: ProductVariant[];
}

export class CreateProductWithVariantsUseCase {
  constructor(private inventoryRepo: InventoryRepository) {}

  execute(
    input: CreateProductWithVariantsInput,
  ): CreateProductWithVariantsOutput {
    const now = new Date();
    const productId = `prod-${crypto.randomUUID()}`;

    const product: Product = {
      id: productId,
      tenantId: input.tenantId,
      name: input.formData.name,
      image: input.formData.image || "",
      baseSku: input.formData.baseSku,
      modelId: input.formData.modelId,
      categoryId: input.formData.categoryId,
      description: input.formData.description,
      is_serial: input.formData.is_serial,
      can_rent: input.formData.can_rent,
      can_sell: input.formData.can_sell,
      createdAt: now,
      createdBy: input.userId,
      updatedAt: now,
      updatedBy: input.userId,
      deletedAt: null,
      deletedBy: null,
      deleteReason: null,
      isDeleted: false,
    };

    const variants = buildVariantsFromProductForm(
      input.tenantId,
      productId,
      input.formData,
    );

    this.inventoryRepo.addProduct(product);
    this.inventoryRepo.addProductVariants(variants);

    return { product, variants };
  }
}
