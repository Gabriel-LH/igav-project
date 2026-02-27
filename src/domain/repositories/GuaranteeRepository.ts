import { Guarantee } from "../../types/guarantee/type.guarantee";

export interface GuaranteeRepository {
  addGuarantee(guarantee: Guarantee): void;
  updateGuaranteeStatus(id: string, status: string): void;
  updateGuarantee(id: string, data: Partial<Guarantee>): void;
  releaseGuarantee(id: string): void;
}
