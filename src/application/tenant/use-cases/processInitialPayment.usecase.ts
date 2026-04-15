import { ClientCreditRepository } from "../../../domain/tenant/repositories/ClientCreditRepository";
import { ClientRepository } from "../../../domain/tenant/repositories/ClientRepository";
import { PaymentMethodCatalogRepository } from "../../../domain/tenant/repositories/PaymentMethodCatalogRepository";
import { PaymentRepository } from "../../../domain/tenant/repositories/PaymentRepository";
import { paymentSchema } from "../../../types/payments/type.payments";

export class ProcessInitialPaymentUseCase {
  constructor(
    private paymentRepo: PaymentRepository,
    private paymentMethodRepo: PaymentMethodCatalogRepository,
    private clientRepo: ClientRepository,
    private clientCreditRepo: ClientCreditRepository,
  ) {}

  async execute(params: {
    directPaymentAmount: number;
    paymentMethodId?: string;
    creditAppliedAmount?: number;
    creditPaymentMethodId?: string;
    operationId: string;
    branchId: string;
    sellerId: string;
    tenantId: string;
    customerId?: string;
  }): Promise<void> {
    const directPaymentAmount = params.directPaymentAmount ?? 0;
    const creditAppliedAmount = params.creditAppliedAmount ?? 0;

    if (directPaymentAmount <= 0 && creditAppliedAmount <= 0) return;
    if (!params.tenantId) {
      throw new Error("tenantId es obligatorio para registrar pagos");
    }

    const createPayment = async (amount: number, paymentMethodId: string) => {
      const now = new Date();
      const paymentData = paymentSchema.parse({
        id: `PAY-${Math.random().toString(36).toUpperCase().substring(2, 9)}`,
        operationId: params.operationId,
        branchId: params.branchId,
        receivedById: params.sellerId,
        amount,
        direction: "in",
        paymentMethodId,
        status: "posted",
        category: "payment",
        date: now,
        createdAt: now,
        tenantId: params.tenantId,
      });

      await this.paymentRepo.addPayment(paymentData);
    };

    if (creditAppliedAmount > 0) {
      if (!params.creditPaymentMethodId) {
        throw new Error("Metodo de credito no encontrado");
      }

      const creditPaymentMethod = await this.paymentMethodRepo.getById(
        params.creditPaymentMethodId,
      );

      if (!creditPaymentMethod || creditPaymentMethod.type !== "credit") {
        throw new Error("Metodo de credito invalido");
      }

      if (!params.customerId) {
        throw new Error("Debes seleccionar un cliente para usar credito");
      }

      const client = await this.clientRepo.getClientById(params.customerId);
      if (!client) {
        throw new Error("Cliente no encontrado para validar credito");
      }

      const currentBalance = client.walletBalance || 0;
      if (currentBalance < creditAppliedAmount) {
        throw new Error(
          `Saldo insuficiente. Credito disponible: S/. ${currentBalance.toFixed(2)}`,
        );
      }

      await this.clientCreditRepo.useCredit(
        params.customerId,
        creditAppliedAmount,
        "used_in_operation",
        params.operationId,
      );

      await createPayment(creditAppliedAmount, params.creditPaymentMethodId);
    }

    if (directPaymentAmount > 0) {
      if (!params.paymentMethodId) {
        throw new Error("Metodo de pago no encontrado");
      }

      const paymentMethod = await this.paymentMethodRepo.getById(
        params.paymentMethodId,
      );

      if (!paymentMethod) {
        throw new Error("Metodo de pago no encontrado");
      }

      if (paymentMethod.type === "credit") {
        throw new Error("El metodo principal no puede ser credito en un pago mixto");
      }

      await createPayment(directPaymentAmount, params.paymentMethodId);
    }
  }
}
