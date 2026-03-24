import { create } from "zustand";
import { Model } from "../types/model/type.model";

interface ModelState {
  models: Model[];
  setModels: (models: Model[]) => void;
  addModel: (model: Model) => void;
  updateModel: (modelId: string, updates: Partial<Model>) => void;
  getModelById: (modelId: string) => Model | undefined;
  getModelsByTenant: (tenantId: string) => Model[];
  getModelsByBrand: (tenantId: string, brandId: string) => Model[];
  markAsActive: (modelId: string) => void;
  markAsInactive: (modelId: string) => void;
  removeModel: (modelId: string) => void;
}

export const useModelStore = create<ModelState>((set, get) => ({
  models: [],
  setModels: (models) => set({ models }),
  addModel: (model) => set((state) => ({ models: [...state.models, model] })),
  updateModel: (modelId, updates) => set((state) => ({
    models: state.models.map((m) => m.id === modelId ? { ...m, ...updates } : m),
  })),
  getModelById: (modelId) => get().models.find((m) => m.id === modelId),
  getModelsByTenant: (tenantId) => get().models.filter((m) => m.tenantId === tenantId),
  getModelsByBrand: (_tenantId, brandId) => get().models.filter((m) => m.brandId === brandId),
  markAsActive: (modelId) => set((state) => ({
    models: state.models.map((m) => m.id === modelId ? { ...m, status: "active" } : m),
  })),
  markAsInactive: (modelId) => set((state) => ({
    models: state.models.map((m) => m.id === modelId ? { ...m, status: "inactive" } : m),
  })),
  removeModel: (modelId) => set((state) => ({
    models: state.models.filter((m) => m.id !== modelId),
  })),
}));
