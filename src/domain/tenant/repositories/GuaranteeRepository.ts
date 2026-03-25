import { Guarantee } from "../../../types/guarantee/type.guarantee";

export interface GuaranteeRepository {
  addGuarantee(guarantee: Guarantee): Promise<void>;
  updateGuaranteeStatus(id: string, status: string): Promise<void>;
  updateGuarantee(id: string, data: Partial<Guarantee>): Promise<void>;
  releaseGuarantee(id: string): Promise<void>;
  getGuarantees(tenantId?: string): Promise<Guarantee[]>;
  getGuaranteeById(id: string): Promise<Guarantee | undefined>;
  getGuaranteeByOperationId(operationId: string): Promise<Guarantee | undefined>;
  findGuaranteeForRental(input: {
    guaranteeId?: string;
    operationId: string;
    rentalId?: string;
  }): Promise<Guarantee | undefined>;
}
