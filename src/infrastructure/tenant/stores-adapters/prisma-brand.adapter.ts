import { BrandRepository } from "../../../domain/tenant/repositories/BrandRepository";
import { Brand } from "../../../types/brand/type.brand";
import prisma from "@/src/lib/prisma";

export class PrismaBrandAdapter implements BrandRepository {
  private prisma = prisma;

  async addBrand(brand: Brand): Promise<void> {
    await this.prisma.brand.create({
      data: {
        id: brand.id,
        tenantId: brand.tenantId,
        name: brand.name,
        slug: brand.slug,
        description: brand.description,
        logo: brand.logo,
        isActive: brand.isActive,
      },
    });
  }

  async updateBrand(brandId: string, updates: Partial<Brand>): Promise<void> {
    await this.prisma.brand.update({
      where: { id: brandId },
      data: {
        name: updates.name,
        slug: updates.slug,
        description: updates.description,
        logo: updates.logo,
        isActive: updates.isActive,
        updatedAt: new Date(),
      },
    });
  }

  async getBrandById(tenantId: string, brandId: string): Promise<Brand | undefined> {
    const brand = await this.prisma.brand.findFirst({
      where: {
        id: brandId,
        tenantId: tenantId,
      },
    });

    if (!brand) return undefined;

    return {
      ...brand,
      description: brand.description ?? undefined,
      logo: brand.logo ?? undefined,
    } as Brand;
  }

  async getBrandsByTenant(tenantId: string): Promise<Brand[]> {
    const brands = await this.prisma.brand.findMany({
      where: {
        tenantId: tenantId,
      },
      orderBy: {
        name: "asc",
      },
    });

    return brands.map((brand) => ({
      ...brand,
      description: brand.description ?? undefined,
      logo: brand.logo ?? undefined,
    })) as Brand[];
  }

  async markAsActive(brandId: string): Promise<void> {
    await this.prisma.brand.update({
      where: { id: brandId },
      data: { isActive: true },
    });
  }

  async markAsInactive(brandId: string): Promise<void> {
    await this.prisma.brand.update({
      where: { id: brandId },
      data: { isActive: false },
    });
  }

  async removeBrand(brandId: string): Promise<void> {
    await this.prisma.brand.delete({
      where: { id: brandId },
    });
  }
}
