import { GuaranteeRepository } from "../../../domain/tenant/repositories/GuaranteeRepository";
import { Guarantee } from "../../../types/guarantee/type.guarantee";
import { useGuaranteeStore } from "../../../store/useGuaranteeStore";

export class ZustandGuaranteeRepository implements GuaranteeRepository {
  async addGuarantee(guarantee: Guarantee): Promise<void> {
    useGuaranteeStore.getState().addGuarantee(guarantee);
  }

  async updateGuaranteeStatus(id: string, status: string): Promise<void> {
    useGuaranteeStore.getState().updateGuaranteeStatus(id, status as any);
  }

  async updateGuarantee(id: string, data: Partial<Guarantee>): Promise<void> {
    return useGuaranteeStore.getState().updateGuarantee({ id, ...data });
  }

  async releaseGuarantee(id: string): Promise<void> {
    return useGuaranteeStore.getState().releaseGuarantee(id);
  }
}
