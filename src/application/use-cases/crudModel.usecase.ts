import { BrandRepository } from "../../domain/repositories/BrandRepository";
import { ModelRepository } from "../../domain/repositories/ModelRepository";
import { Model } from "../../types/model/type.model";
import { CreateModelInput } from "../interfaces/CreateModelInput";
import { UpdateModelInput } from "../interfaces/UpdateModelInput";

interface DeleteModelInput {
  tenantId: string;
  modelId: string;
}

interface ListModelsOptions {
  includeInactive?: boolean;
  brandId?: string;
}

const buildUniqueSlug = (baseName: string, existingSlugs: string[]): string => {
  const base = baseName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  let slug = base;
  let index = 1;
  while (existingSlugs.includes(slug)) {
    slug = `${base}-${index}`;
    index++;
  }

  return slug;
};

export class CreateModelUseCase {
  constructor(
    private modelRepo: ModelRepository,
    private brandRepo: BrandRepository,
  ) {}

  execute(data: CreateModelInput): Model {
    const brand = this.brandRepo.getBrandById(data.tenantId, data.brandId);
    if (!brand) {
      throw new Error("La marca seleccionada no existe para este tenant.");
    }

    const models = this.modelRepo.getModelsByTenant(data.tenantId);
    const existingSlugs = models.map((model) => model.slug);
    const slug = buildUniqueSlug(data.slug?.trim() || data.name, existingSlugs);
    const now = new Date();

    const model: Model = {
      id: `model-${crypto.randomUUID()}`,
      tenantId: data.tenantId,
      brandId: data.brandId,
      name: data.name,
      slug,
      description: data.description,
      year: data.year,
      isActive: data.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    };

    this.modelRepo.addModel(model);
    return model;
  }
}

export class UpdateModelUseCase {
  constructor(
    private modelRepo: ModelRepository,
    private brandRepo: BrandRepository,
  ) {}

  execute(data: UpdateModelInput): Model {
    const model = this.modelRepo.getModelById(data.tenantId, data.modelId);
    if (!model) {
      throw new Error("El modelo no existe para este tenant.");
    }

    const nextBrandId = data.brandId ?? model.brandId;
    const brand = this.brandRepo.getBrandById(data.tenantId, nextBrandId);
    if (!brand) {
      throw new Error("La marca seleccionada no existe para este tenant.");
    }

    const models = this.modelRepo
      .getModelsByTenant(data.tenantId)
      .filter((item) => item.id !== data.modelId);
    const existingSlugs = models.map((item) => item.slug);
    const nextName = data.name ?? model.name;
    const nextSlug =
      data.slug?.trim() ||
      (data.name ? buildUniqueSlug(nextName, existingSlugs) : model.slug);

    this.modelRepo.updateModel(data.modelId, {
      brandId: nextBrandId,
      name: nextName,
      slug: nextSlug,
      description: data.description ?? model.description,
      year: data.year ?? model.year,
      isActive: data.isActive ?? model.isActive,
      updatedAt: new Date(),
    });

    return this.modelRepo.getModelById(data.tenantId, data.modelId) ?? model;
  }
}

export class DeleteModelUseCase {
  constructor(private modelRepo: ModelRepository) {}

  execute(data: DeleteModelInput): void {
    const model = this.modelRepo.getModelById(data.tenantId, data.modelId);
    if (!model) {
      throw new Error("El modelo no existe para este tenant.");
    }

    this.modelRepo.removeModel(data.modelId);
  }
}

export class ListModelsUseCase {
  constructor(private modelRepo: ModelRepository) {}

  execute(tenantId: string, options?: ListModelsOptions): Model[] {
    const includeInactive = options?.includeInactive ?? true;
    const brandId = options?.brandId;

    return this.modelRepo
      .getModelsByTenant(tenantId)
      .filter((model) => (brandId ? model.brandId === brandId : true))
      .filter((model) => includeInactive || model.isActive)
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }
}
