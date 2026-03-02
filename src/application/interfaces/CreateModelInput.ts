export interface CreateModelInput {
  tenantId: string;
  brandId: string;
  name: string;
  slug?: string;
  description?: string;
  year?: number;
  isActive?: boolean;
}
