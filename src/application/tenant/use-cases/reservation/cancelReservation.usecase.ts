import { ReservationRepository } from "@/src/domain/tenant/repositories/ReservationRepository";
import { PaymentRepository } from "@/src/domain/tenant/repositories/PaymentRepository";
import { OperationRepository } from "@/src/domain/tenant/repositories/OperationRepository";

export class CancelReservationUseCase {
  constructor(
    private reservationRepo: ReservationRepository,
    private paymentRepo: PaymentRepository,
    private operationRepo: OperationRepository,
  ) {}

  execute(reservationId: string, reason: string, userId: string): void {
    const reservation = this.reservationRepo.getReservationById(reservationId);

    if (!reservation) {
      throw new Error("Reserva no encontrada");
    }

    this.reservationRepo.cancelReservation(reservationId);

    this.operationRepo.updateOperationStatus(
      reservation.operationId,
      "cancelado",
    );

    const payments = this.paymentRepo.getPaymentsByOperationId(
      reservation.operationId,
    );
    const totalRefund = payments.reduce(
      (acc, p) => acc + (p.direction === "in" ? p.amount : -p.amount),
      0,
    );

    if (totalRefund > 0) {
      const firstPaymentMethod =
        payments.find((p) => p.direction === "in")?.paymentMethodId || "cash";

      this.paymentRepo.addPayment({
        id: `PAY-${crypto.randomUUID()}`,
        operationId: reservation.operationId,
        amount: totalRefund,
        paymentMethodId: firstPaymentMethod,
        direction: "out",
        status: "posted",
        category: "refund",
        date: new Date(),
        notes: `Reembolso por anulación de reserva. Razón: ${reason || "N/A"}`,
        receivedById: userId,
        branchId: reservation.branchId,
      } as any);
    }
  }
}
