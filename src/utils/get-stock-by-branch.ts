import { Product } from "../types/product/type.product";
import { Stock } from "../types/product/type.stock";

/**
 * 1. Filtra el catálogo: Solo productos que tienen existencias en una sede específica.
 */
export const getProductsInBranch = (
  products: Product[], 
  stocks: Stock[], 
  branchId: string
): Product[] => {
  // Obtenemos los IDs de productos que tienen stock > 0 en esa sucursal
  const productIdsWithStock = stocks
    .filter(s => s.branchId === branchId && s.quantity > 0)
    .map(s => s.productId);

  // Devolvemos solo los productos cuyos IDs están en esa lista
  return products.filter(p => productIdsWithStock.includes(p.id.toString()));
};

/**
 * 2. Analítica Global: ¿Cuántos hay en "todas las sedes" de X variante?
 */
export const getVariantGlobalStock = (
  stocks: Stock[], 
  productId: string, 
  size: string, 
  color: string
): number => {
  return stocks
    .filter(s => 
      s.productId === productId && 
      s.size === size && 
      s.color === color
    )
    .reduce((acc, curr) => acc + curr.quantity, 0);
};

/**
 * 3. Operativo Local: ¿Cuántos hay de X variante en MI mostrador?
 */
export const getVariantBranchStock = (
  stocks: Stock[], 
  productId: string, 
  branchId: string,
  size: string, 
  color: string
): number => {
  const stockItem = stocks.find(s => 
    s.productId === productId && 
    s.branchId === branchId && 
    s.size === size && 
    s.color === color
  );
  
  return stockItem?.quantity || 0;
};

/**
 * Suma todo el stock de un producto sin importar talla, color o sede.
 * Útil para la vista general del Catálogo.
 */
export const getProductGlobalStock = (stocks: Stock[], productId: number | string): number => {
  const productIdStr = productId.toString(); // Normalizamos para evitar errores de tipo
  
  return stocks
    .filter(s => s.productId.toString() === productIdStr)
    .reduce((acc, curr) => acc + curr.quantity, 0);
};

/**
 * Suma todo el stock de un producto en una sucursal específica.
 * Útil para saber cuánta mercadería total hay en "Sucursal Centro".
 */
export const getProductStockByBranch = (
  stocks: Stock[], 
  productId: number | string, 
  branchId: string
): number => {
  const productIdStr = productId.toString();
  
  return stocks
    .filter(s => s.productId.toString() === productIdStr && s.branchId === branchId)
    .reduce((acc, curr) => acc + curr.quantity, 0);
};