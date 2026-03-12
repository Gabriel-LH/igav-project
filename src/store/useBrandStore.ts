import { create } from "zustand";
import { Brand } from "../types/brand/type.brand";
import { BRANDS_MOCK } from "../mocks/mock.brand";

interface BrandState {
  brands: Brand[];
  setBrands: (brands: Brand[]) => void;
  addBrand: (brand: Brand) => void;
  updateBrand: (brandId: string, updates: Partial<Brand>) => void;
  getBrandById: (tenantId: string, brandId: string) => Brand | undefined;
  getBrandsByTenant: (tenantId: string) => Brand[];
  markAsActive: (brandId: string) => void;
  markAsInactive: (brandId: string) => void;
  removeBrand: (brandId: string) => void;
}

export const useBrandStore = create<BrandState>((set, get) => ({
  brands: BRANDS_MOCK,
  setBrands: (brands) => set({ brands }),

  addBrand: (brand) =>
    set((state) => ({
      brands: [...state.brands, brand],
    })),

  updateBrand: (brandId, updates) =>
    set((state) => ({
      brands: state.brands.map((brand) =>
        brand.id === brandId ? { ...brand, ...updates } : brand,
      ),
    })),

  getBrandById: (tenantId, brandId) =>
    get().brands.find((brand) => brand.tenantId === tenantId && brand.id === brandId),

  getBrandsByTenant: (tenantId) =>
    get().brands.filter((brand) => brand.tenantId === tenantId),

  markAsActive: (brandId) =>
    set((state) => ({
      brands: state.brands.map((brand) =>
        brand.id === brandId ? { ...brand, isActive: true } : brand,
      ),
    })),

  markAsInactive: (brandId) =>
    set((state) => ({
      brands: state.brands.map((brand) =>
        brand.id === brandId ? { ...brand, isActive: false } : brand,
      ),
    })),

  removeBrand: (brandId) =>
    set((state) => ({
      brands: state.brands.filter((brand) => brand.id !== brandId),
    })),
}));
