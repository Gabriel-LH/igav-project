import { Branch } from "../../../types/branch/type.branch";

export interface BranchRepository {
  getBranchesByTenant(tenantId: string): Promise<Branch[]>;
  getBranchById(tenantId: string, id: string): Promise<Branch | null>;
  createBranch(tenantId: string, branch: Partial<Branch>): Promise<Branch>;
  updateBranch(tenantId: string, id: string, branch: Partial<Branch>): Promise<Branch>;
}
