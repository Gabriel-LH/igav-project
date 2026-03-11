import { ModelRepository } from "../../../domain/tenant/repositories/ModelRepository";
import { Model } from "../../../types/model/type.model";
import { useModelStore } from "../../../store/useModelStore";

export class ZustandModelRepository implements ModelRepository {
  async addModel(model: Model): Promise<void> {
    useModelStore.getState().addModel(model);
  }

  async updateModel(modelId: string, updates: Partial<Model>): Promise<void> {
    useModelStore.getState().updateModel(modelId, updates);
  }

  async getModelById(tenantId: string, modelId: string): Promise<Model | undefined> {
    return useModelStore.getState().getModelById(tenantId, modelId);
  }

  async getModelsByTenant(tenantId: string): Promise<Model[]> {
    return useModelStore.getState().getModelsByTenant(tenantId);
  }

  async getModelsByBrand(tenantId: string, brandId: string): Promise<Model[]> {
    return useModelStore.getState().getModelsByBrand(tenantId, brandId);
  }

  async markAsActive(modelId: string): Promise<void> {
    useModelStore.getState().markAsActive(modelId);
  }

  async markAsInactive(modelId: string): Promise<void> {
    useModelStore.getState().markAsInactive(modelId);
  }

  async removeModel(modelId: string): Promise<void> {
    useModelStore.getState().removeModel(modelId);
  }
}
