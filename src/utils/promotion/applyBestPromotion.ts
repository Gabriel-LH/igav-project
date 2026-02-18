import { Product } from "@/src/types/product/type.product";
import { Promotion } from "@/src/types/promotion/type.promotion";

const applyBestPromotion = (product: Product, price: number, activePromotions: Promotion[]) => {
  // Filtramos promociones que apliquen a este producto
  const validPromos = activePromotions.filter(promo => {
     if (promo.scope === 'global') return true;
     if (promo.scope === 'category' && promo.targetIds?.includes(product.category)) return true;
     if (promo.scope === 'product_specific' && promo.targetIds?.includes(product.id)) return true;
     return false;
  });

  if (validPromos.length === 0) return { finalPrice: price, discount: 0, reason: null };

  // Buscamos el mejor descuento para el cliente
  let bestPrice = price;
  let bestPromoName = "";

  validPromos.forEach(promo => {
     let currentDiscount = 0;
     if (promo.type === 'percentage') {
        currentDiscount = price * (promo.value / 100);
     } else {
        currentDiscount = promo.value;
     }

     const newPrice = Math.max(0, price - currentDiscount);
     
     if (newPrice < bestPrice) {
        bestPrice = newPrice;
        bestPromoName = promo.name;
     }
  });

  return { 
     finalPrice: bestPrice, 
     discount: price - bestPrice, 
     reason: bestPromoName 
  };
};