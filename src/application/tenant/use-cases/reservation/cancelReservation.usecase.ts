import { ReservationRepository } from "@/src/domain/tenant/repositories/ReservationRepository";
import { PaymentRepository } from "@/src/domain/tenant/repositories/PaymentRepository";
import { OperationRepository } from "@/src/domain/tenant/repositories/OperationRepository";
import { InventoryRepository } from "@/src/domain/tenant/repositories/InventoryRepository";
import { Payment } from "@/src/types/payments/type.payments";

export class CancelReservationUseCase {
  constructor(
    private reservationRepo: ReservationRepository,
    private paymentRepo: PaymentRepository,
    private operationRepo: OperationRepository,
    private inventoryRepo: InventoryRepository,
  ) {}

  async execute(
    reservationId: string,
    reason: string,
    userId: string,
  ): Promise<void> {
    const reservation =
      await this.reservationRepo.getReservationWithItemsById(reservationId);

    if (!reservation) {
      throw new Error("Reserva no encontrada");
    }

    await this.reservationRepo.cancelReservation(reservationId);

    // --- Liberación de Stock ---
    for (const item of reservation.items) {
      if (item.stockId) {
        // Solo intentamos liberar si es un ítem de stock (serializado o con lote)
        // La lógica de CreateReservationUseCase solo actualiza si isSerial es true
        if (await this.inventoryRepo.isSerial(item.stockId)) {
          await this.inventoryRepo.updateItemStatus(item.stockId, "disponible");
        }
      }
    }

    await this.operationRepo.updateOperationStatus(
      reservation.operationId,
      "cancelado",
    );

    const payments = await this.paymentRepo.getPaymentsByOperationId(
      reservation.operationId,
    );
    const totalRefund = payments.reduce(
      (acc, p) => acc + (p.direction === "in" ? p.amount : -p.amount),
      0,
    );

    if (totalRefund > 0) {
      const firstPaymentMethod =
        payments.find((p) => p.direction === "in")?.paymentMethodId || "cash";

      await this.paymentRepo.addPayment({
        id: `PAY-${crypto.randomUUID()}`,
        tenantId: reservation.tenantId,
        operationId: reservation.operationId,
        amount: totalRefund,
        paymentMethodId: firstPaymentMethod,
        direction: "out",
        status: "posted",
        category: "refund",
        date: new Date(),
        createdAt: new Date(),
        notes: `Reembolso por anulación de reserva. Razón: ${reason || "N/A"}`,
        receivedById: userId,
        branchId: reservation.branchId,
      } as Payment);
    }
  }
}

