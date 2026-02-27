import { RentalRepository } from "../../domain/repositories/RentalRepository";
import { GuaranteeRepository } from "../../domain/repositories/GuaranteeRepository";
import { OperationRepository } from "../../domain/repositories/OperationRepository";
import { PaymentRepository } from "../../domain/repositories/PaymentRepository";

export class CancelRentalUseCase {
  constructor(
    private rentalRepo: RentalRepository,
    private guaranteeRepo: GuaranteeRepository,
    private operationRepo: OperationRepository,
    private paymentRepo: PaymentRepository,
  ) {}

  execute(rentalId: string, reason: string, userId: string): void {
    const rental = this.rentalRepo.getRentalById
      ? this.rentalRepo.getRentalById(rentalId)
      : null;

    if (!rental) {
      throw new Error("Rental no encontrado o método no implementado en repo");
    }

    this.rentalRepo.cancelRental(rentalId, reason);

    if (rental.guaranteeId) {
      this.guaranteeRepo.releaseGuarantee(rental.guaranteeId);
    }

    this.operationRepo.updateOperationStatus(rental.operationId, "cancelado");

    const payments = this.paymentRepo.getPaymentsByOperationId(
      rental.operationId,
    );
    let totalRefund = payments.reduce(
      (acc, p) => acc + (p.direction === "in" ? p.amount : -p.amount),
      0,
    );

    if (totalRefund > 0) {
      const firstPaymentMethod =
        payments.find((p) => p.direction === "in")?.method || "cash";

      this.paymentRepo.addPayment({
        id: `PAY-${crypto.randomUUID()}`,
        operationId: rental.operationId,
        amount: totalRefund,
        method: firstPaymentMethod,
        direction: "out",
        status: "posted",
        category: "refund",
        date: new Date(),
        notes: `Reembolso por anulación de alquiler. Razón: ${reason || "N/A"}`,
        receivedById: userId,
        branchId: rental.branchId,
      } as any);
    }
  }
}
