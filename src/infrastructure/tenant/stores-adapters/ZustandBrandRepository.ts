import { BrandRepository } from "../../../domain/tenant/repositories/BrandRepository";
import { Brand } from "../../../types/brand/type.brand";
import { useBrandStore } from "../../../store/useBrandStore";

export class ZustandBrandRepository implements BrandRepository {
  addBrand(brand: Brand): void {
    useBrandStore.getState().addBrand(brand);
  }

  updateBrand(brandId: string, updates: Partial<Brand>): void {
    useBrandStore.getState().updateBrand(brandId, updates);
  }

  getBrandById(tenantId: string, brandId: string): Brand | undefined {
    return useBrandStore.getState().getBrandById(tenantId, brandId);
  }

  getBrandsByTenant(tenantId: string): Brand[] {
    return useBrandStore.getState().getBrandsByTenant(tenantId);
  }

  markAsActive(brandId: string): void {
    useBrandStore.getState().markAsActive(brandId);
  }

  markAsInactive(brandId: string): void {
    useBrandStore.getState().markAsInactive(brandId);
  }

  removeBrand(brandId: string): void {
    useBrandStore.getState().removeBrand(brandId);
  }
}
