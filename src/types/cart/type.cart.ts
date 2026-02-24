import { Product } from "../product/type.product";

export type CartOperationType = "venta" | "alquiler";

export interface CartItem {
  cartId: string;
  product: Product;
  operationType: CartOperationType;

  quantity: number;
  unitPrice: number;
  subtotal: number; // o calcular dinámicamente
  listPrice?: number;

  selectedSizeId?: string;
  selectedColorId?: string;
  selectedCodes: string[];

  // Promoción y descuentos
  appliedPromotionId?: string;
  discountAmount?: number;
  discountReason?: string;

  // Notas por item
  notes?: string;

  // Packs o combos
  bundleId?: string;
}
