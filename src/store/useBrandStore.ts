import { create } from "zustand";
import { Brand } from "../types/brand/type.brand";

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
  brands: [],
  setBrands: (brands) => set({ brands }),
  addBrand: (brand) => set((state) => ({ brands: [...state.brands, brand] })),
  updateBrand: (brandId, updates) => set((state) => ({
    brands: state.brands.map((b) => b.id === brandId ? { ...b, ...updates } : b),
  })),
  getBrandById: (_tenantId, brandId) => get().brands.find((b) => b.id === brandId),
  getBrandsByTenant: (tenantId) => get().brands.filter((b) => b.tenantId === tenantId),
  markAsActive: (brandId) => set((state) => ({
    brands: state.brands.map((b) => b.id === brandId ? { ...b, status: "active" } : b),
  })),
  markAsInactive: (brandId) => set((state) => ({
    brands: state.brands.map((b) => b.id === brandId ? { ...b, status: "inactive" } : b),
  })),
  removeBrand: (brandId) => set((state) => ({
    brands: state.brands.filter((b) => b.id !== brandId),
  })),
}));
