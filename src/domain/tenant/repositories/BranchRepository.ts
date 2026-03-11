import { Branch } from "../../../types/branch/type.branch";

export interface BranchRepository {
  getBranchesByTenant(tenantId: string): Promise<Branch[]>;
  getBranchById(tenantId: string, branchId: string): Promise<Branch | null>;
}
