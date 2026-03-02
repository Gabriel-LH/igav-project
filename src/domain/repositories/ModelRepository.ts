import { Model } from "../../types/model/type.model";

export interface ModelRepository {
  addModel(model: Model): void;
  updateModel(modelId: string, updates: Partial<Model>): void;
  getModelById(tenantId: string, modelId: string): Model | undefined;
  getModelsByTenant(tenantId: string): Model[];
  getModelsByBrand(tenantId: string, brandId: string): Model[];
  markAsActive(modelId: string): void;
  markAsInactive(modelId: string): void;
  removeModel(modelId: string): void;
}
