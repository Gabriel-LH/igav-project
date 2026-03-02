export interface CreateBrandInput {
  tenantId: string;
  name: string;
  slug?: string;
  description?: string;
  logo?: string;
  isActive?: boolean;
}
