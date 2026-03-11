import { ModelRepository } from "../../../domain/tenant/repositories/ModelRepository";
import { Model } from "../../../types/model/type.model";
import prisma from "@/src/lib/prisma";


export class PrismaModelAdapter implements ModelRepository {
  private prisma = prisma;

  async addModel(model: Model): Promise<void> {
    await this.prisma.model.create({
      data: {
        id: model.id,
        tenantId: model.tenantId,
        brandId: model.brandId,
        name: model.name,
        slug: model.slug,
        description: model.description,
        year: model.year,
        isActive: model.isActive,
      },
    });
  }

  async updateModel(modelId: string, updates: Partial<Model>): Promise<void> {
    await this.prisma.model.update({
      where: { id: modelId },
      data: {
        name: updates.name,
        slug: updates.slug,
        description: updates.description,
        year: updates.year,
        isActive: updates.isActive,
        updatedAt: new Date(),
      },
    });
  }

  async getModelById(tenantId: string, modelId: string): Promise<Model | undefined> {
    const model = await this.prisma.model.findFirst({
      where: {
        id: modelId,
        tenantId: tenantId,
      },
    });

    if (!model) return undefined;

    return {
      ...model,
      description: model.description ?? undefined,
      year: model.year ?? undefined,
    } as Model;
  }

  async getModelsByTenant(tenantId: string): Promise<Model[]> {
    const models = await this.prisma.model.findMany({
      where: {
        tenantId: tenantId,
      },
      orderBy: {
        name: "asc",
      },
    });

    return models.map((model) => ({
      ...model,
      description: model.description ?? undefined,
      year: model.year ?? undefined,
    })) as Model[];
  }

  async getModelsByBrand(tenantId: string, brandId: string): Promise<Model[]> {
    const models = await this.prisma.model.findMany({
      where: {
        tenantId: tenantId,
        brandId: brandId,
      },
      orderBy: {
        name: "asc",
      },
    });

    return models.map((model) => ({
      ...model,
      description: model.description ?? undefined,
      year: model.year ?? undefined,
    })) as Model[];
  }

  async markAsActive(modelId: string): Promise<void> {
    await this.prisma.model.update({
      where: { id: modelId },
      data: { isActive: true },
    });
  }

  async markAsInactive(modelId: string): Promise<void> {
    await this.prisma.model.update({
      where: { id: modelId },
      data: { isActive: false },
    });
  }

  async removeModel(modelId: string): Promise<void> {
    await this.prisma.model.delete({
      where: { id: modelId },
    });
  }
}
