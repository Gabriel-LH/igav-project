import { create } from "zustand";
import { Model } from "../types/model/type.model";
import { MODELS_MOCK } from "../mocks/mock.models";

interface ModelState {
  models: Model[];
  addModel: (model: Model) => void;
  updateModel: (modelId: string, updates: Partial<Model>) => void;
  getModelById: (tenantId: string, modelId: string) => Model | undefined;
  getModelsByTenant: (tenantId: string) => Model[];
  getModelsByBrand: (tenantId: string, brandId: string) => Model[];
  markAsActive: (modelId: string) => void;
  markAsInactive: (modelId: string) => void;
  removeModel: (modelId: string) => void;
}

export const useModelStore = create<ModelState>((set, get) => ({
  models: MODELS_MOCK,

  addModel: (model) =>
    set((state) => ({
      models: [...state.models, model],
    })),

  updateModel: (modelId, updates) =>
    set((state) => ({
      models: state.models.map((model) =>
        model.id === modelId ? { ...model, ...updates } : model,
      ),
    })),

  getModelById: (tenantId, modelId) =>
    get().models.find((model) => model.tenantId === tenantId && model.id === modelId),

  getModelsByTenant: (tenantId) =>
    get().models.filter((model) => model.tenantId === tenantId),

  getModelsByBrand: (tenantId, brandId) =>
    get().models.filter(
      (model) => model.tenantId === tenantId && model.brandId === brandId,
    ),

  markAsActive: (modelId) =>
    set((state) => ({
      models: state.models.map((model) =>
        model.id === modelId ? { ...model, isActive: true } : model,
      ),
    })),

  markAsInactive: (modelId) =>
    set((state) => ({
      models: state.models.map((model) =>
        model.id === modelId ? { ...model, isActive: false } : model,
      ),
    })),

  removeModel: (modelId) =>
    set((state) => ({
      models: state.models.filter((model) => model.id !== modelId),
    })),
}));
