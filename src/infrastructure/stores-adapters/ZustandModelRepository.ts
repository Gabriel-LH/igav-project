import { ModelRepository } from "../../domain/repositories/ModelRepository";
import { Model } from "../../types/model/type.model";
import { useModelStore } from "../../store/useModelStore";

export class ZustandModelRepository implements ModelRepository {
  addModel(model: Model): void {
    useModelStore.getState().addModel(model);
  }

  updateModel(modelId: string, updates: Partial<Model>): void {
    useModelStore.getState().updateModel(modelId, updates);
  }

  getModelById(tenantId: string, modelId: string): Model | undefined {
    return useModelStore.getState().getModelById(tenantId, modelId);
  }

  getModelsByTenant(tenantId: string): Model[] {
    return useModelStore.getState().getModelsByTenant(tenantId);
  }

  getModelsByBrand(tenantId: string, brandId: string): Model[] {
    return useModelStore.getState().getModelsByBrand(tenantId, brandId);
  }

  markAsActive(modelId: string): void {
    useModelStore.getState().markAsActive(modelId);
  }

  markAsInactive(modelId: string): void {
    useModelStore.getState().markAsInactive(modelId);
  }

  removeModel(modelId: string): void {
    useModelStore.getState().removeModel(modelId);
  }
}
