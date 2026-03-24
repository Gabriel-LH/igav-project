import { RentalRepository } from "../../../domain/tenant/repositories/RentalRepository";
import { GuaranteeRepository } from "../../../domain/tenant/repositories/GuaranteeRepository";
import { OperationRepository } from "../../../domain/tenant/repositories/OperationRepository";
import { PaymentRepository } from "../../../domain/tenant/repositories/PaymentRepository";
import { Payment } from "../../../types/payments/type.payments";

export class CancelRentalUseCase {
  constructor(
    private rentalRepo: RentalRepository,
    private guaranteeRepo: GuaranteeRepository,
    private operationRepo: OperationRepository,
    private paymentRepo: PaymentRepository,
  ) {}

  async execute(rentalId: string, reason: string, userId: string): Promise<void> {
    const rental = await this.rentalRepo.getRentalById(rentalId);

    if (!rental) {
      throw new Error("Rental no encontrado");
    }

    await this.rentalRepo.cancelRental(rentalId, reason);

    if (rental.guaranteeId) {
      await this.guaranteeRepo.releaseGuarantee(rental.guaranteeId);
    }

    await this.operationRepo.updateOperationStatus(rental.operationId, "cancelado");

    const payments = await this.paymentRepo.getPaymentsByOperationId(
      rental.operationId,
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
        tenantId: rental.tenantId,
        operationId: rental.operationId,
        amount: totalRefund,
        paymentMethodId: firstPaymentMethod,
        direction: "out",
        status: "posted",
        category: "refund",
        date: new Date(),
        createdAt: new Date(),
        notes: `Reembolso por anulación de alquiler. Razón: ${reason || "N/A"}`,
        receivedById: userId,
        branchId: rental.branchId,
      } as Payment);
    }
  }
}
