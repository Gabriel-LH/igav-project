// types/product.ts
export interface ProductFormData {
  // === PASO 1: INFO BASE ===
  name: string;
  baseSku: string;
  modelId?: string;
  brandId?: string;
  categoryId: string;
  description: string;
  image?: string[];

  // Flags de comportamiento
  can_rent: boolean;
  can_sell: boolean;
  is_serial: boolean; // 👈 Afecta toda la arquitectura de stock

  // === PASO 2: CONFIGURACIÓN DE VARIANTES ===
  // Solo esto se persiste como "configuración"
  selectedAttributes: SelectedAttributeConfig[];

  // === PASO 3: OVERRIDES DE USUARIO ===
  // Solo lo que el usuario MODIFICÓ manualmente
  variantOverrides: Record<string, VariantOverride>; // key: variantSignature
}

export interface SelectedAttributeConfig {
  attributeId: string;
  attributeName: string;
  attributeCode: string;
  values: SelectedValue[]; // Valores seleccionados para esta variante
}

export interface VariantFormData {
  id: string;
  variantCode: string;
  barcode?: string;
  attributes: Record<string, string>;
  priceRent?: number;
  priceSell?: number;
  rentUnit: "hora" | "día" | "semana" | "mes" | "evento";
  isActive: boolean;
}

export interface VariantOverride {
  variantSignature: string; // "Color:Negro|Talla:M" - identificador único
  variantCode?: string; // Si modificó el SKU auto-generado
  barcode?: string; // Si modificó el código de barras
  priceRent?: number; // Si modificó el precio
  priceSell?: number; // Si modificó el precio
  rentUnit?: string; // Si modificó la unidad
  isActive?: boolean; // Si desactivó esta variante
  // Metadata para UI
  isEdited?: boolean; // Flag para mostrar "editado por usuario"
  images?: string[];
  purchasePrice?: number;
}

// Tipo calculado (no se guarda, se genera)
export interface ComputedVariant {
  id: string; // Generado en runtime
  signature: string; // "Color:Negro|Talla:M"
  variantCode: string; // SKU final (base + attrs + override)
  barcode: string; // Código de barras
  attributes: Record<string, string>;
  priceRent: number;
  priceSell: number;
  rentUnit: string;
  isActive: boolean;
  hasOverride: boolean; // Indica si usuario modificó algo
  images?: string[];
  purchasePrice?: number;
}

export interface SelectedValue {
  valueId: string;
  code: string;
  value: string;
}

// Necesitamos estos tipos para los selectores
export interface ModelOption {
  id: string;
  name: string;
  brandName: string; // Para mostrar en el selector
  brandId: string;
}

export interface CategoryOption {
  id: string;
  name: string;
  fullPath: string; // "Electrónica > Celulares > Smartphones"
  level: number;
  parentId?: string;
  children?: CategoryOption[];
}
