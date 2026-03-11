import { BrandRepository } from "../../../domain/tenant/repositories/BrandRepository";
import { Brand } from "../../../types/brand/type.brand";
import { useBrandStore } from "../../../store/useBrandStore";

export class ZustandBrandRepository implements BrandRepository {
  async addBrand(brand: Brand): Promise<void> {
    useBrandStore.getState().addBrand(brand);
  }

  async updateBrand(brandId: string, updates: Partial<Brand>): Promise<void> {
    useBrandStore.getState().updateBrand(brandId, updates);
  }

  async getBrandById(tenantId: string, brandId: string): Promise<Brand | undefined> {
    return useBrandStore.getState().getBrandById(tenantId, brandId);
  }

  async getBrandsByTenant(tenantId: string): Promise<Brand[]> {
    return useBrandStore.getState().getBrandsByTenant(tenantId);
  }

  async markAsActive(brandId: string): Promise<void> {
    useBrandStore.getState().markAsActive(brandId);
  }

  async markAsInactive(brandId: string): Promise<void> {
    useBrandStore.getState().markAsInactive(brandId);
  }

  async removeBrand(brandId: string): Promise<void> {
    useBrandStore.getState().removeBrand(brandId);
  }
}
