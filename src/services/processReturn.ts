import { useRentalStore } from "@/src/store/useRentalStore";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { useGuaranteeStore } from "@/src/store/useGuaranteeStore";
import { useOperationStore } from "@/src/store/useOperationStore";

interface ProcessReturnInput {
  rentalId: string;
  itemStatus: "devuelto" | "con_daños" | "perdido";
  stockTarget: "lavanderia" | "mantenimiento" | "baja" | "disponible";
  totalPenalty: number;
  guaranteeResult: "devuelta" | "retenida";
  notes?: string;
}
export function processReturn(input: ProcessReturnInput) {
  const now = new Date();

  const rentalStore = useRentalStore.getState();
  const inventoryStore = useInventoryStore.getState();
  const guaranteeStore = useGuaranteeStore.getState();
  const operationStore = useOperationStore.getState();

  const rental = rentalStore.getRentalById(input.rentalId);
  if (!rental) throw new Error("Rental no encontrado");

  // 1️⃣ Actualizar rental
  rentalStore.updateRental(rental.id, {
    status: "devuelto",
    totalPenalty: input.totalPenalty,
    actualReturnDate: now,
    notes: input.notes,
  });
  // 2️⃣ Inventario
  const items = rentalStore.rentalItems.filter((i) => i.rentalId === rental.id);

  items.forEach((item) => {
    inventoryStore.updateStockStatus(item.stockId, input.stockTarget);
  });

  // 3️⃣ Garantía
  if (rental.guaranteeId) {
    guaranteeStore.updateGuaranteeStatus(
      rental.guaranteeId,
      input.guaranteeResult,
    );
  }

  // 4️⃣ Operación
  operationStore.updateOperation(rental.operationId, {
    status: "completado",
  });
}
