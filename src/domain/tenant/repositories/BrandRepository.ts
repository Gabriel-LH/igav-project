import { Brand } from "../../../types/brand/type.brand";

export interface BrandRepository {
  addBrand(brand: Brand): Promise<void>;
  updateBrand(brandId: string, updates: Partial<Brand>): Promise<void>;
  getBrandById(tenantId: string, brandId: string): Promise<Brand | undefined>;
  getBrandsByTenant(tenantId: string): Promise<Brand[]>;
  markAsActive(brandId: string): Promise<void>;
  markAsInactive(brandId: string): Promise<void>;
  removeBrand(brandId: string): Promise<void>;
}
