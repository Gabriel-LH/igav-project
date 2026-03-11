import { BranchRepository } from "@/src/domain/tenant/repositories/BranchRepository";
import { Branch } from "@/src/types/branch/type.branch";

export class ListBranchesUseCase {
  constructor(private branchRepo: BranchRepository) {}

  async execute(tenantId: string): Promise<Branch[]> {
    if (!tenantId) {
      throw new Error("El ID del tenant es obligatorio.");
    }
    return this.branchRepo.getBranchesByTenant(tenantId);
  }
}
