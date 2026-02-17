import { Product } from "../product/type.product";
export type CartOperationType = "venta" | "alquiler";

export interface CartItem {
  cartId: string;
  product: Product;
  operationType: CartOperationType;
  quantity: number;
  unitPrice: number;
  subtotal: number;

  // 🔥 NUEVOS CAMPOS CLAVE
  selectedSize?: string; // Ej: "M"
  selectedColor?: string; // Ej: "Rojo"

  selectedCodes: string[];
}
