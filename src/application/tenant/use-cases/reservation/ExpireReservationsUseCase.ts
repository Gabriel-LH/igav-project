import { ReservationRepository } from "@/src/domain/tenant/repositories/ReservationRepository";
import { InventoryRepository } from "@/src/domain/tenant/repositories/InventoryRepository";
import { OperationRepository } from "@/src/domain/tenant/repositories/OperationRepository";

export class ExpireReservationsUseCase {
  constructor(
    private reservationRepo: ReservationRepository,
    private inventoryRepo: InventoryRepository,
    private operationRepo: OperationRepository,
  ) {}

  async execute(tenantId: string, expireAfterHours: number): Promise<number> {
    // 1. Obtener las reservas que han expirado según el umbral
    const expiredReservations = await this.reservationRepo.getExpiredReservations(
      tenantId,
      expireAfterHours,
    );

    if (expiredReservations.length === 0) {
      return 0;
    }

    let expiredCount = 0;

    for (const reservation of expiredReservations) {
      try {
        // 2. Actualizar el estado de la reserva a 'expirada'
        // Status: 'expirada', ItemStatus: 'expirada'
        await this.reservationRepo.updateStatus(
          reservation.id,
          "expirada",
          "expirada",
        );

        // 3. Liberar el stock asociado
        for (const item of reservation.items) {
          if (item.stockId) {
            if (await this.inventoryRepo.isSerial(item.stockId)) {
              await this.inventoryRepo.updateItemStatus(
                item.stockId,
                "disponible",
              );
            }
          }
        }

        // 4. Actualizar el estado de la operación si corresponde
        // Por ahora, si la reserva expira, la operación podría quedar como 'cancelado' o un nuevo estado 'expirado'
        // Según OperationStatus enum: pendiente, en_progreso, completado, cancelado.
        // Usaremos 'cancelado' para mantener consistencia con fallos de proceso.
        await this.operationRepo.updateOperationStatus(
          reservation.operationId,
          "cancelado",
        );

        expiredCount++;
      } catch (error) {
        console.error(`Error al expirar reserva ${reservation.id}:`, error);
      }
    }

    return expiredCount;
  }
}
