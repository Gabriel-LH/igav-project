export interface TenantRepository {
  getTenantIdByTransaction(dto: any): string;
}
