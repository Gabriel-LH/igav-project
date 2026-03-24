import { Guarantee } from "../../../types/guarantee/type.guarantee";

export interface GuaranteeRepository {
  addGuarantee(guarantee: Guarantee): Promise<void>;
  updateGuaranteeStatus(id: string, status: string): Promise<void>;
  updateGuarantee(id: string, data: Partial<Guarantee>): Promise<void>;
  releaseGuarantee(id: string): Promise<void>;
  getGuarantees(tenantId?: string): Promise<Guarantee[]>;
}
