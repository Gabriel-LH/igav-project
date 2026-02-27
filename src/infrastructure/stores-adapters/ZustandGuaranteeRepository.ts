import { GuaranteeRepository } from "../../domain/repositories/GuaranteeRepository";
import { Guarantee } from "../../types/guarantee/type.guarantee";
import { useGuaranteeStore } from "../../store/useGuaranteeStore";

export class ZustandGuaranteeRepository implements GuaranteeRepository {
  addGuarantee(guarantee: Guarantee): void {
    useGuaranteeStore.getState().addGuarantee(guarantee);
  }

  updateGuaranteeStatus(id: string, status: string): void {
    useGuaranteeStore.getState().updateGuaranteeStatus(id, status as any);
  }

  updateGuarantee(id: string, data: Partial<Guarantee>): void {
    return useGuaranteeStore.getState().updateGuarantee({ id, ...data });
  }

  releaseGuarantee(id: string): void {
    return useGuaranteeStore.getState().releaseGuarantee(id);
  }
}
