import { Product } from "@/src/types/product/type.product";
import { ProductVariant } from "@/src/types/product/type.productVariant";
import { InventoryItem } from "@/src/types/product/type.inventoryItem";
import { StockLot } from "@/src/types/product/type.stockLote";

export type ProductLookupMatchType =
  | "productId"
  | "baseSku"
  | "variantCode"
  | "variantBarcode"
  | "serialCode"
  | "inventoryItemId"
  | "stockLotId"
  | "stockLotBarcode";

export interface ProductLookupResolution {
  productId: string;
  variantId?: string;
  itemId?: string;
  matchType: ProductLookupMatchType;
  lookupValue: string;
}

interface ProductLookupInput {
  products: Product[];
  productVariants: ProductVariant[];
  inventoryItems: InventoryItem[];
  stockLots: StockLot[];
  lookup: string;
}

const normalize = (value: string): string => value.trim().toLowerCase();

export function resolveProductLookup(
  input: ProductLookupInput,
): ProductLookupResolution | null {
  const lookup = normalize(input.lookup);
  if (!lookup) return null;

  const productById = input.products.find((product) => normalize(product.id) === lookup);
  if (productById) {
    return {
      productId: productById.id,
      matchType: "productId",
      lookupValue: input.lookup,
    };
  }

  const productBySku = input.products.find(
    (product) => normalize(product.baseSku) === lookup,
  );
  if (productBySku) {
    return {
      productId: productBySku.id,
      matchType: "baseSku",
      lookupValue: input.lookup,
    };
  }

  const variantByCode = input.productVariants.find(
    (variant) => normalize(variant.variantCode) === lookup,
  );
  if (variantByCode) {
    return {
      productId: variantByCode.productId,
      variantId: variantByCode.id,
      matchType: "variantCode",
      lookupValue: input.lookup,
    };
  }

  const variantByBarcode = input.productVariants.find(
    (variant) => variant.barcode && normalize(variant.barcode) === lookup,
  );
  if (variantByBarcode) {
    return {
      productId: variantByBarcode.productId,
      variantId: variantByBarcode.id,
      matchType: "variantBarcode",
      lookupValue: input.lookup,
    };
  }

  const inventoryBySerial = input.inventoryItems.find(
    (item) => normalize(item.serialCode) === lookup,
  );
  if (inventoryBySerial) {
    return {
      productId: inventoryBySerial.productId,
      variantId: inventoryBySerial.variantId,
      itemId: inventoryBySerial.id,
      matchType: "serialCode",
      lookupValue: input.lookup,
    };
  }

  const inventoryById = input.inventoryItems.find(
    (item) => normalize(item.id) === lookup,
  );
  if (inventoryById) {
    return {
      productId: inventoryById.productId,
      variantId: inventoryById.variantId,
      itemId: inventoryById.id,
      matchType: "inventoryItemId",
      lookupValue: input.lookup,
    };
  }

  const stockById = input.stockLots.find((stockLot) => normalize(stockLot.id) === lookup);
  if (stockById) {
    return {
      productId: stockById.productId,
      variantId: stockById.variantId,
      itemId: stockById.id,
      matchType: "stockLotId",
      lookupValue: input.lookup,
    };
  }

  const stockByBarcode = input.stockLots.find(
    (stockLot) => stockLot.barcode && normalize(stockLot.barcode) === lookup,
  );
  if (stockByBarcode) {
    return {
      productId: stockByBarcode.productId,
      variantId: stockByBarcode.variantId,
      itemId: stockByBarcode.id,
      matchType: "stockLotBarcode",
      lookupValue: input.lookup,
    };
  }

  return null;
}
