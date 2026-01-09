import { Product } from "../types/payments/type.product";

/**
 * 1. Filtra el catálogo: Solo productos con stock en una sede específica.
 */
export const getProductsInBranch = (products: Product[], branchId: string): Product[] => {
  return products.filter(product => 
    product.inventory.some(variant => 
      variant.locations.some(loc => loc.branchId === branchId && loc.quantity > 0)
    )
  );
};

/**
 * 2. Analítica Global: ¿Cuántos hay en "todo el mundo" de X variante?
 */
export const getVariantGlobalStock = (product: Product, size: string, color: string): number => {
  const variant = product.inventory.find(
    inv => inv.size === size && inv.color === color
  );
  
  // Usamos reduce para sumar el stock de todas las locations
  return variant?.locations.reduce((acc, loc) => acc + loc.quantity, 0) || 0;
};

/**
 * 3. Operativo Local: ¿Cuántos hay de X variante en MI mostrador?
 * (Este es el que usará el vendedor para confirmar una venta inmediata)
 */
export const getVariantBranchStock = (
  product: Product, 
  size: string, 
  color: string, 
  branchId: string
): number => {
  const variant = product.inventory.find(
    inv => inv.size === size && inv.color === color
  );
  
  const locationStock = variant?.locations.find(loc => loc.branchId === branchId);
  
  return locationStock?.quantity || 0;
};