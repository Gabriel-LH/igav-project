import { CashSession } from "../../../types/cash/type.cash";

export interface CashSessionRepository {
  getSessionsByTenant(tenantId: string): Promise<CashSession[]>;
  findActiveSession(tenantId: string, branchId: string): Promise<CashSession | null>;
}
