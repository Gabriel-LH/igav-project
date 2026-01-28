import { useRentalStore } from "@/src/store/useRentalStore";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { useGuaranteeStore } from "@/src/store/useGuaranteeStore";
import { useOperationStore } from "@/src/store/useOperationStore";

interface ProcessReturnInput {
  rentalId: string;

  rentalStatus: "devuelto" | "con_daños" | "perdido";

  items: {
    rentalItemId: string;
    itemStatus: "devuelto" | "en_lavanderia" | "en_mantenimiento" | "baja";
    stockTarget: "disponible" | "en_lavanderia" | "en_mantenimiento" | "baja";
  }[];

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

  // 1️⃣ Rental (contrato)
  rentalStore.updateRental(rental.id, {
    status: input.rentalStatus,
    totalPenalty: input.totalPenalty,
    actualReturnDate: now,
    notes: input.notes,
  });

  // 2️⃣ Items + Stock
  input.items.forEach((item) => {
    rentalStore.processReturnItem(item.rentalItemId, item.itemStatus);

    const rentalItem = rentalStore.rentalItems.find(
      (i) => i.id === item.rentalItemId,
    );
    if (!rentalItem) return;

    inventoryStore.updateStockStatus(rentalItem.stockId, item.stockTarget);
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
