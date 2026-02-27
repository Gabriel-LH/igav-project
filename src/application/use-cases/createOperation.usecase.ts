import { OperationRepository } from "../../domain/repositories/OperationRepository";
import {
  operationSchema,
  Operation,
} from "../../types/operation/type.operations";
import { calculateOperationPaymentStatus } from "../../utils/payment-helpers";
import { generateOperationReference } from "../../utils/operation/generateOperationReference";

export class CreateOperationUseCase {
  constructor(private operationRepo: OperationRepository) {}

  execute(dto: any, totalAmount: number, initialNetPaid: number): Operation {
    const now = new Date();
    const operations = this.operationRepo.getOperations();

    const todayString = now.toISOString().split("T")[0];
    const todayOperationsByType = operations.filter(
      (op) =>
        op.type === dto.type &&
        op.date.toISOString().split("T")[0] === todayString,
    );
    const sequence = todayOperationsByType.length + 1;
    const referenceCode = generateOperationReference(dto.type, now, sequence);

    const operationPaymentStatus = calculateOperationPaymentStatus(
      totalAmount,
      initialNetPaid,
    );

    const operationData = operationSchema.parse({
      id: crypto.randomUUID(),
      referenceCode,
      branchId: dto.branchId,
      sellerId: dto.sellerId,
      customerId: dto.customerId,
      type: dto.type,
      status: "en_progreso",
      paymentStatus: operationPaymentStatus,
      totalAmount,
      date: now,
      createdAt: now,
    });

    this.operationRepo.addOperation(operationData);

    return operationData;
  }
}
