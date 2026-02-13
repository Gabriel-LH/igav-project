export const autoAllocateStock = ({
  activeRes,
  reservationItems,
  stock,
  operationType,
  currentSelections,
}: {
  activeRes: any;
  reservationItems: any[];
  stock: any[];
  operationType: "venta" | "alquiler";
  currentSelections: Record<string, string>;
}) => {

  if (!activeRes) return;

  const newSelections: Record<string, string> = { ...currentSelections };
  const usedStockIds = new Set(Object.values(newSelections));

  reservationItems.forEach((resItem: any) => {
      // Repetimos por la cantidad solicitada en cada línea
      for (let i = 0; i < resItem.quantity; i++) {
        const key = `${resItem.id}-${i}`; // Clave única para cada unidad: ID_ITEM + ÍNDICE
        
        // Si ya tiene asignado algo, saltamos
        if (newSelections[key]) {
            usedStockIds.add(newSelections[key]);
            continue;
        }

        // Buscar candidatos
        const candidates = stock.filter((s: any) => {
          const isMatch =
            String(s.productId) === String(resItem.productId) &&
            s.size === resItem.size &&
            s.color?.toLowerCase() === resItem.color?.toLowerCase() &&
            s.status === "disponible" &&
            !usedStockIds.has(s.id) && // Que no esté usado en esta iteración
            (operationType === "venta" ? s.isForSale : s.isForRent);
            
          return isMatch;
        });

        // ORDENAR CANDIDATOS: Preferir Sede Actual > Otras Sedes
        candidates.sort((a, b) => {
            if (a.branchId === activeRes.branchId && b.branchId !== activeRes.branchId) return -1;
            if (a.branchId !== activeRes.branchId && b.branchId === activeRes.branchId) return 1;
            return 0;
        });

        if (candidates.length > 0) {
          const bestFit = candidates[0];
          newSelections[key] = bestFit.id;
          usedStockIds.add(bestFit.id);
        }
      }
    });

    return newSelections;
};