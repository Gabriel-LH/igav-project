import { Product } from "../../../types/product/type.product";
import { ProductVariant } from "../../../types/product/type.productVariant";

/**
 * Producto es la raíz del agregado.
 * Todo acceso a ProductVariant pasa por Producto.
*/

export interface ProductRepository {
  // ── Producto (Aggregate Root) ──────────────────────────
  createProduct(product: Product): Promise<void>;
  updateProduct(productId: string, updates: Partial<Product>): Promise<void>;
  getProductById(tenantId: string, productId: string): Promise<Product | null>;
  getProductsByTenant(
    tenantId: string,
    opts?: { includeDeleted?: boolean },
  ): Promise<Product[]>;
  softDeleteProduct(productId: string, deletedBy: string): Promise<void>;

  // ── ProductVariant (parte del agregado Product) ────────
  createVariants(variants: ProductVariant[]): Promise<void>;
  getVariantsByProductId(productId: string): Promise<ProductVariant[]>;
  getVariantsByTenant(tenantId: string): Promise<ProductVariant[]>;
  updateVariant(
    variantId: string,
    updates: Partial<ProductVariant>,
  ): Promise<void>;
  deleteVariantsByProductId(productId: string): Promise<void>;
}
