import { useGuaranteeStore } from "../store/useGuaranteeStore";
import { useOperationStore } from "../store/useOperationStore";
import { useRentalStore } from "../store/useRentalStore";

export function cancelRentalTransaction(
  rentalId: string,
  reason?: string
) {
  const rentalStore = useRentalStore.getState();
  const guaranteeStore = useGuaranteeStore.getState();
  const operationStore = useOperationStore.getState();

  const rental = rentalStore.rentals.find(r => r.id === rentalId);
  if (!rental) throw new Error("Rental no encontrado");

  rentalStore.cancelRental(rentalId, reason);

  if (rental.guaranteeId) {
    guaranteeStore.releaseGuarantee(rental.guaranteeId);
  }

  operationStore.updateOperation(rental.operationId, {
    status: "cancelado",
  });
}
