import { Branch } from "../../../types/branch/type.branch";

export interface BranchRepository {
  getBranches(): Promise<Branch[]>;
  getBranchById(id: string): Promise<Branch | undefined>;
}
