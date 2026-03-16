import { Product } from "../../../types/product/type.product";
import { ProductVariant } from "../../../types/product/type.productVariant";

/**
 * Product is the Aggregate Root.
 * All access to ProductVariant goes through Product.
 */
export interface ProductRepository {
  // ── Product (Aggregate Root) ──────────────────────────
  createProduct(product: Product): Promise<void>;
  updateProduct(productId: string, updates: Partial<Product>): Promise<void>;
  getProductById(tenantId: string, productId: string): Promise<Product | null>;
  getProductsByTenant(
    tenantId: string,
    opts?: { includeDeleted?: boolean },
  ): Promise<Product[]>;
  softDeleteProduct(productId: string, deletedBy: string): Promise<void>;

  // ── ProductVariant (part of Product aggregate) ────────
  createVariants(variants: ProductVariant[]): Promise<void>;
  getVariantsByProductId(productId: string): Promise<ProductVariant[]>;
  getVariantsByTenant(tenantId: string): Promise<ProductVariant[]>;
  updateVariant(
    variantId: string,
    updates: Partial<ProductVariant>,
  ): Promise<void>;
  deleteVariantsByProductId(productId: string): Promise<void>;
}
