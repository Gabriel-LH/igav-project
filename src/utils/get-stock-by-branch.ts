import { Product } from "../types/product/type.product";
import { InventoryItem } from "../types/product/type.inventoryItem";
import { StockLot } from "../types/product/type.stockLote";

type StockItem = InventoryItem | StockLot;

/**
 * 1. Filtra el catálogo: Solo productos que tienen existencias en una sede específica.
 */
export const getProductsInBranch = (
  products: Product[],
  stocks: StockItem[],
  branchId: string,
): Product[] => {
  // Obtenemos los IDs de productos que tienen stock > 0 en esa sucursal
  const productIdsWithStock = stocks
    .filter(
      (s) =>
        s.branchId === branchId && ("quantity" in s ? s.quantity > 0 : true),
    )
    .map((s) => s.productId);

  // Devolvemos solo los productos cuyos IDs están en esa lista
  return products.filter((p) => productIdsWithStock.includes(p.id.toString()));
};

/**
 * 2. Analítica Global: ¿Cuántos hay en "todas las sedes" de X variante?
 */
export const getVariantGlobalStock = (
  stocks: StockItem[],
  productId: string,
  sizeId: string,
  colorId: string,
): number => {
  return stocks
    .filter(
      (s) =>
        s.productId === productId &&
        s.sizeId === sizeId &&
        s.colorId === colorId,
    )
    .reduce((acc, curr) => acc + ("quantity" in curr ? curr.quantity : 1), 0);
};

/**
 * 3. Operativo Local: ¿Cuántos hay de X variante en MI mostrador?
 */
export const getVariantBranchStock = (
  stocks: StockItem[],
  productId: string,
  branchId: string,
  sizeId: string,
  colorId: string,
): number => {
  const stockItems = stocks.filter(
    (s) =>
      s.productId === productId &&
      s.branchId === branchId &&
      s.sizeId === sizeId &&
      s.colorId === colorId,
  );

  return stockItems.reduce(
    (acc, curr) => acc + ("quantity" in curr ? curr.quantity : 1),
    0,
  );
};

/**
 * Suma todo el stock de un producto sin importar talla, color o sede.
 * Útil para la vista general del Catálogo.
 */
export const getProductGlobalStock = (
  stocks: StockItem[],
  productId: number | string,
): number => {
  const productIdStr = productId.toString(); // Normalizamos para evitar errores de tipo

  return stocks
    .filter((s) => s.productId.toString() === productIdStr)
    .reduce((acc, curr) => acc + ("quantity" in curr ? curr.quantity : 1), 0);
};

/**
 * Suma todo el stock de un producto en una sucursal específica.
 * Útil para saber cuánta mercadería total hay en "Sucursal Centro".
 */
export const getProductStockByBranch = (
  stocks: StockItem[],
  productId: number | string,
  branchId: string,
): number => {
  const productIdStr = productId.toString();

  return stocks
    .filter(
      (s) => s.productId.toString() === productIdStr && s.branchId === branchId,
    )
    .reduce((acc, curr) => acc + ("quantity" in curr ? curr.quantity : 1), 0);
};
