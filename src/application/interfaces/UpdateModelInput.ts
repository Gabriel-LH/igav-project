export interface UpdateModelInput {
  tenantId: string;
  modelId: string;
  brandId?: string;
  name?: string;
  slug?: string;
  description?: string;
  year?: number;
  isActive?: boolean;
}
