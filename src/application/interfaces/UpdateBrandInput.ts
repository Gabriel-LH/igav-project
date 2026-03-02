export interface UpdateBrandInput {
  tenantId: string;
  brandId: string;
  name?: string;
  slug?: string;
  description?: string;
  logo?: string;
  isActive?: boolean;
}
