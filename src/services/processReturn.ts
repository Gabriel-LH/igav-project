import { useRentalStore } from "@/src/store/useRentalStore";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { StockStatus } from "../utils/status-type/StockStatusType";
import { useGuaranteeStore } from "@/src/store/useGuaranteeStore";
import { useOperationStore } from "@/src/store/useOperationStore";

interface ProcessReturnInput {
  rentalId: string;
  rentalStatus: "devuelto" | "con_daños" | "perdido"; // Estado global del contrato
  
  // Lista de items devueltos con su destino físico
  items: {
    rentalItemId: string;
    itemStatus: "devuelto" | "en_lavanderia" | "en_mantenimiento" | "baja"; // Estado en el contrato
    stockTarget: StockStatus; // Estado físico destino (disponible, mantenimiento, etc.)
  }[];

  totalPenalty: number;
  guaranteeResult: "devuelta" | "retenida";
  notes?: string;
}

export function processReturn(input: ProcessReturnInput) {
  const now = new Date();

  // Stores
  const rentalStore = useRentalStore.getState();
  const inventoryStore = useInventoryStore.getState();
  const guaranteeStore = useGuaranteeStore.getState();
  const operationStore = useOperationStore.getState();

  // Validación
  const rental = rentalStore.getRentalById(input.rentalId);
  if (!rental) throw new Error("Rental no encontrado");

  // 1️⃣ Actualizar CONTRATO (RentalStore)
  // Marcamos items como devueltos en el historial del alquiler
  input.items.forEach((itemInput) => {
     // Aquí usamos itemStatus (ej: "devuelto" o "baja" para el historial)
     rentalStore.processReturnItem(itemInput.rentalItemId, itemInput.itemStatus);
  });

  // Actualizamos cabecera del contrato
  rentalStore.updateRental(rental.id, {
    status: input.rentalStatus,
    totalPenalty: input.totalPenalty,
    actualReturnDate: now,
    notes: input.notes,
  });

  // 2️⃣ Actualizar STOCK FÍSICO (InventoryStore) 🔥 [AQUÍ ESTÁ EL CAMBIO CLAVE]
  input.items.forEach((itemInput) => {
    // Buscamos el item del alquiler para obtener el stockId real
    const rentalItem = rentalStore.rentalItems.find(
      (i) => i.id === itemInput.rentalItemId
    );
    
    if (!rentalItem) return; // Should not happen

    // Determinamos si es Serial (Item Único) o Lote
    const isSerial = inventoryStore.inventoryItems.some(i => i.id === rentalItem.stockId);

    if (isSerial) {
        // CAMINO A: SERIALIZADO
        // El item existe físicamente, cambiamos su etiqueta
        inventoryStore.updateItemStatus(
            rentalItem.stockId, 
            itemInput.stockTarget, // ej: "en_lavanderia"
            undefined, // No cambia de sucursal
            "SYSTEM_RETURN" // Admin ID (o pasarlo en input)
        );
    } else {
        // CAMINO B: LOTE
        // El item "vuelve" al montón. Solo sumamos si está operativo.
        
        // Si el destino es "disponible", lo sumamos de vuelta.
        if (itemInput.stockTarget === "disponible") {
            inventoryStore.increaseLotQuantity(rentalItem.stockId, rentalItem.quantity);
        }
        
        // Si el destino es "baja", "dañado" o "lavandería" en un sistema simple de lotes,
        // típicamente NO sumamos al stock disponible. Se considera "merma" o "fuera de servicio".
        // Si quisieras controlar lotes en lavandería, necesitarías un almacén secundario.
        // Por ahora, solo sumamos si está disponible.
    }
  });

  // 3️⃣ Liberar GARANTÍA
  if (rental.guaranteeId) {
    guaranteeStore.updateGuaranteeStatus(
      rental.guaranteeId,
      input.guaranteeResult
    );
  }

  // 4️⃣ Cerrar OPERACIÓN
  if (input.rentalStatus === "devuelto") {
      operationStore.updateOperation(rental.operationId, {
        status: "completado",
      });
  }
}