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

    // 2. Sincronizar Variantes con Upsert
    // Obtenemos las variantes actuales de la BD
    const currentVariants = await this.productRepo.getVariantsByProductId(input.productId);
    // Construimos las variantes nuevas desde el formulario
    const newVariants = buildVariantsFromProductForm(input.tenantId, input.productId, input.formData);

    // Crear un mapa de variantes actuales por su signature
    const currentBySignature = new Map(
      currentVariants.map((v) => [v.variantSignature, v]),
    );

    // Crear un set de signatures nuevas para detectar las eliminadas
    const newSignatures = new Set(
      newVariants.map((v) => {
        // El signature se construye como "AttrName:Value|AttrName:Value"
        // y se guarda en variantSignature al crearse
        // Para las variantes nuevas, construimos la signature desde los atributos
        return Object.entries(v.attributes)
          .map(([k, val]) => `${k}:${val}`)
          .join("|");
      }),
    );

    // Variantes a CREAR (signature nueva, no existe en BD)
    const toCreate = newVariants.filter((nv) => {
      const sig = Object.entries(nv.attributes)
        .map(([k, val]) => `${k}:${val}`)
        .join("|");
      return !currentBySignature.has(sig);
    });

    // Variantes a ACTUALIZAR (signature existe en BD)
    const toUpdate: { variantId: string; updates: any }[] = [];
    for (const nv of newVariants) {
      const sig = Object.entries(nv.attributes)
        .map(([k, val]) => `${k}:${val}`)
        .join("|");
      const existing = currentBySignature.get(sig);
      if (existing) {
        toUpdate.push({
          variantId: existing.id,
          updates: {
            variantCode: nv.variantCode,
            barcode: nv.barcode,
            attributes: nv.attributes,
            purchasePrice: nv.purchasePrice,
            priceSell: nv.priceSell,
            priceRent: nv.priceRent,
            rentUnit: nv.rentUnit,
            image: nv.image,
            isActive: nv.isActive,
          },
        });
      }
    }

    // Variantes a DESACTIVAR (existen en BD pero no en el nuevo set)
    const toDeactivate = currentVariants.filter(
      (cv) => !newSignatures.has(cv.variantSignature),
    );

    // Ejecutar operaciones
    if (toCreate.length > 0) {
      // Asignar las signatures correctas antes de crear
      const variantsWithSignatures = toCreate.map((v) => ({
        ...v,
        variantSignature: Object.entries(v.attributes)
          .map(([k, val]) => `${k}:${val}`)
          .join("|"),
      }));
      await this.productRepo.createVariants(variantsWithSignatures);
    }

    for (const { variantId, updates: variantUpdates } of toUpdate) {
      await this.productRepo.updateVariant(variantId, variantUpdates);
    }

    // Desactivar variantes eliminadas en lugar de borrarlas
    for (const variant of toDeactivate) {
      await this.productRepo.updateVariant(variant.id, { isActive: false });
    }
  }
}
