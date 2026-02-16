import { useInventoryStore } from "@/src/store/useInventoryStore";
import { Product } from "@/src/types/product/type.product";

interface AllocationRequest {
  product: Product;
  quantity: number;
  operationType: 'venta' | 'alquiler';
  branchId: string;
  // Opcionales si ya vienen pre-seleccionados (Serial manual)
  manualStockIds?: string[];
  // Opcionales si es un producto con variantes
  size?: string;
  color?: string;
}

export const useStockAllocation = () => {
  const { stock: allStock } = useInventoryStore();

  const allocateStock = (req: AllocationRequest) => {
    // 1. FILTRADO DE CANDIDATOS
    const candidates = allStock.filter(s => {
      // Coincidencias básicas
      const matchBasic = 
        s.productId === req.product.id &&
        s.branchId === req.branchId &&
        s.status === 'disponible';
      
      if (!matchBasic) return false;

      // Coincidencias de variante (si aplica)
      if (req.size && s.size !== req.size) return false;
      if (req.color && s.color !== req.color) return false;

      // Coincidencia de propósito
      return req.operationType === 'venta' ? s.isForSale : s.isForRent;
    });

    // 2. VALIDACIÓN DE CANTIDAD TOTAL
    const totalAvailable = candidates.reduce((acc, curr) => acc + curr.quantity, 0);
    
    if (totalAvailable < req.quantity) {
      return { 
        success: false, 
        error: `Stock insuficiente. Solicitado: ${req.quantity}, Disponible: ${totalAvailable}` 
      };
    }

    // 3. ESTRATEGIA DE ASIGNACIÓN
    let allocatedItems: Array<{ stockId: string; quantity: number }> = [];

    if (req.product.is_serial) {
      // ESTRATEGIA MANUAL (Serial)
      if (!req.manualStockIds || req.manualStockIds.length !== req.quantity) {
        return { success: false, error: "Faltan asignar IDs seriales" };
      }
      
      // Validar que los IDs manuales existan y estén disponibles en los candidatos
      const validManuals = req.manualStockIds.every(id => candidates.some(c => c.id === id));
      if (!validManuals) {
          return { success: false, error: "Algunos IDs seleccionados no están disponibles o válidos" };
      }

      allocatedItems = req.manualStockIds.map(id => ({ stockId: id, quantity: 1 }));

    } else {
      // ESTRATEGIA AUTOMÁTICA (Lote/Bulk) - FIFO
      let remaining = req.quantity;
      
      for (const candidate of candidates) {
        if (remaining <= 0) break;
        
        const take = Math.min(remaining, candidate.quantity);
        allocatedItems.push({ stockId: candidate.id, quantity: take });
        remaining -= take;
      }
    }

    return { success: true, items: allocatedItems };
  };

  return { allocateStock };
};