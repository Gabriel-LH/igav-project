import { ProductFormData } from "../../../interfaces/ProductForm";
import { ProductRepository } from "../../../../domain/tenant/repositories/ProductRepository";
import { Product } from "../../../../types/product/type.product";
import { buildVariantsFromProductForm } from "../../../../utils/variants/buildVariantsFromForm";

interface UpdateProductWithVariantsInput {
  tenantId: string;
  productId: string;
  userId: string;
  formData: ProductFormData;
}

export class UpdateProductWithVariantsUseCase {
  constructor(private productRepo: ProductRepository) {}

  async execute(input: UpdateProductWithVariantsInput): Promise<void> {
    const now = new Date();

    // 1. Update Product
    const updates: Partial<Product> = {
      name: input.formData.name,
      image: input.formData.image || [],
      baseSku: input.formData.baseSku,
      modelId: input.formData.modelId,
      categoryId: input.formData.categoryId,
      description: input.formData.description,
      is_serial: input.formData.is_serial,
      can_rent: input.formData.can_rent,
      can_sell: input.formData.can_sell,
      updatedAt: now,
      updatedBy: input.userId,
    };

    await this.productRepo.updateProduct(input.productId, updates);

    // 2. Sincronizar Variantes
    // Por simplicidad en este MVP, borramos las variantes anteriores y creamos las nuevas
    // (A menos que tengan stock o movimientos, en cuyo caso esto fallaría por FK, 
    // pero para este paso inicial usaremos este enfoque o uno de "UPSERT")
    
    // Mejor enfoque: Obtener variantes actuales
    const currentVariants = await this.productRepo.getVariantsByProductId(input.productId);
    const newVariants = buildVariantsFromProductForm(input.tenantId, input.productId, input.formData);

    // Borramos todas las variantes actuales y creamos las nuevas
    // Nota: En producción esto debería ser un diff para no romper FKs
    await this.productRepo.deleteVariantsByProductId(input.productId);
    await this.productRepo.createVariants(newVariants);
  }
}
