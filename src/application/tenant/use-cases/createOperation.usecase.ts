import { OperationRepository } from "../../../domain/tenant/repositories/OperationRepository";
import {
  operationSchema,
  Operation,
} from "../../../types/operation/type.operations";
import { calculateOperationPaymentStatus } from "../../../utils/payment-helpers";
import { generateOperationReference } from "../../../utils/operation/generateOperationReference";

export class CreateOperationUseCase {
  constructor(private operationRepo: OperationRepository) {}

  async execute(
    dto: any,
    totalAmount: number,
    initialNetPaid: number,
    tenantId: string,
    snapshots?: {
      policySnapshot?: unknown;
      configSnapshot?: unknown;
      policyVersion?: number;
      configVersion?: Date;
    },
  ): Promise<Operation> {
    const now = new Date();
    const lastSequence = await this.operationRepo.getLastSequence(
      tenantId,
      dto.type,
    );
    const sequence = lastSequence + 1;
    const referenceCode = generateOperationReference(dto.type, now, sequence);

    const operationPaymentStatus = calculateOperationPaymentStatus(
      totalAmount,
      initialNetPaid,
    );

    const rawCustomerId = dto.customerId || "";
    const hasCustomer = rawCustomerId.trim().length > 0;
    const customerMode = hasCustomer 
      ? (dto.customerMode || "registered") 
      : "general";

    const operationData = operationSchema.parse({
      id: crypto.randomUUID(),
      tenantId,
      referenceCode,
      branchId: dto.branchId,
      sellerId: dto.sellerId,
      customerId: rawCustomerId,
      customerMode,
      type: dto.type,
      status: "en_progreso",
      paymentStatus: operationPaymentStatus,
      subtotal: dto.financials?.subtotal,
      discountAmount: dto.financials?.totalDiscount,
      taxAmount: dto.financials?.taxAmount,
      taxRate: (snapshots?.configSnapshot as Record<string, any>)?.tenant?.tax?.rate
        ?? (snapshots?.configSnapshot as Record<string, any>)?.tax?.rate,
      roundingAmount: dto.financials?.roundingDifference,
      totalBeforeRounding: dto.financials?.totalBeforeRounding,
      totalAmount,
      date: now,
      createdAt: now,
      policySnapshot: snapshots?.policySnapshot,
      configSnapshot: snapshots?.configSnapshot,
      policyVersion: snapshots?.policyVersion,
      configVersion: snapshots?.configVersion,
    });

    await this.operationRepo.addOperation(operationData);

    // NEW: Save Global Discounts (Points / Coupons)
    const discountsApplied: any[] = [];
    const financials = dto.financials;

    if (financials?.pointsDiscount > 0) {
      discountsApplied.push({
        id: crypto.randomUUID(),
        tenantId,
        operationId: operationData.id,
        amount: financials.pointsDiscount,
        reason: "POINTS",
        description: "Canje de puntos de fidelidad",
        createdAt: now,
      });
    }

    if (financials?.couponDiscount > 0) {
      discountsApplied.push({
        id: crypto.randomUUID(),
        tenantId,
        operationId: operationData.id,
        amount: financials.couponDiscount,
        reason: "COUPON",
        description: `Cupón aplicado: ${financials.couponCode || "Desconocido"}`,
        createdAt: now,
      });
    }

    if (discountsApplied.length > 0) {
      await this.operationRepo.addDiscounts(discountsApplied);
    }

    return operationData;
  }
}
