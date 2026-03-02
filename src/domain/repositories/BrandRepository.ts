import { Brand } from "../../types/brand/type.brand";

export interface BrandRepository {
  addBrand(brand: Brand): void;
  updateBrand(brandId: string, updates: Partial<Brand>): void;
  getBrandById(tenantId: string, brandId: string): Brand | undefined;
  getBrandsByTenant(tenantId: string): Brand[];
  markAsActive(brandId: string): void;
  markAsInactive(brandId: string): void;
  removeBrand(brandId: string): void;
}
