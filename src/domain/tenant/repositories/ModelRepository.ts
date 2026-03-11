import { Model } from "../../../types/model/type.model";

export interface ModelRepository {
  addModel(model: Model): Promise<void>;
  updateModel(modelId: string, updates: Partial<Model>): Promise<void>;
  getModelById(tenantId: string, modelId: string): Promise<Model | undefined>;
  getModelsByTenant(tenantId: string): Promise<Model[]>;
  getModelsByBrand(tenantId: string, brandId: string): Promise<Model[]>;
  markAsActive(modelId: string): Promise<void>;
  markAsInactive(modelId: string): Promise<void>;
  removeModel(modelId: string): Promise<void>;
}
