import { useMemo } from "react";
import { useInventoryStore } from "@/src/store/useInventoryStore";

export interface InventoryProductOption {
  id: string;
  name: string;
  is_serial: boolean;
  can_rent: boolean;
  can_sell: boolean;
  variants: Array<{
    id: string;
    name: string;
    variantCode: string;
    barcode: string;
  }>;
}

const hashCode = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash;
};

export function useInventoryProductOptions(serialized: boolean): InventoryProductOption[] {
  const products = useInventoryStore((state) => state.products);
  const productVariants = useInventoryStore((state) => state.productVariants);

  return useMemo(() => {
    return products
      .filter(
        (product) =>
          product.is_serial === serialized &&
          !product.isDeleted,
      )
      .map((product) => ({
        id: product.id,
        name: product.name,
        is_serial: product.is_serial,
        can_rent: product.can_rent,
        can_sell: product.can_sell,
        variants: productVariants
          .filter((variant) => variant.productId === product.id && variant.isActive)
          .map((variant) => ({
            id: variant.id,
            name:
              Object.values(variant.attributes || {}).length > 0
                ? Object.values(variant.attributes).join(" / ")
                : variant.variantCode,
            variantCode: variant.variantCode,
            barcode:
              variant.barcode ??
              String(Math.abs(hashCode(variant.variantCode))).slice(0, 13).padStart(13, "0"),
          })),
      }));
  }, [productVariants, products, serialized]);
}
