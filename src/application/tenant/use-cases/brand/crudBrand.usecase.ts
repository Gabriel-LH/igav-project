import { BrandRepository } from "../../../../domain/tenant/repositories/BrandRepository";
import { ModelRepository } from "../../../../domain/tenant/repositories/ModelRepository";
import { Brand } from "../../../../types/brand/type.brand";
import { CreateBrandInput } from "../../../interfaces/CreateBrandInput";
import { UpdateBrandInput } from "../../../interfaces/UpdateBrandInput";

interface DeleteBrandInput {
  tenantId: string;
  brandId: string;
}

interface ListBrandsOptions {
  includeInactive?: boolean;
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

export class CreateBrandUseCase {
  constructor(private brandRepo: BrandRepository) {}

  async execute(data: CreateBrandInput): Promise<Brand> {
    const brands = await this.brandRepo.getBrandsByTenant(data.tenantId);
    const existingSlugs = brands.map((brand) => brand.slug);
    const slug = buildUniqueSlug(data.slug?.trim() || data.name, existingSlugs);
    const now = new Date();

    const brand: Brand = {
      id: `brand-${crypto.randomUUID()}`,
      tenantId: data.tenantId,
      name: data.name,
      slug,
      description: data.description,
      logo: data.logo,
      isActive: data.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    };

    await this.brandRepo.addBrand(brand);
    return brand;
  }
}

export class UpdateBrandUseCase {
  constructor(private brandRepo: BrandRepository) {}

  async execute(data: UpdateBrandInput): Promise<Brand> {
    const brand = await this.brandRepo.getBrandById(
      data.tenantId,
      data.brandId,
    );
    if (!brand) {
      throw new Error("La marca no existe para este tenant.");
    }

    const brands = (
      await this.brandRepo.getBrandsByTenant(data.tenantId)
    ).filter((item) => item.id !== data.brandId);
    const existingSlugs = brands.map((item) => item.slug);
    const slug =
      data.slug?.trim() ||
      (data.name ? buildUniqueSlug(data.name, existingSlugs) : brand.slug);

    await this.brandRepo.updateBrand(data.brandId, {
      name: data.name ?? brand.name,
      slug,
      description: data.description ?? brand.description,
      logo: data.logo ?? brand.logo,
      isActive: data.isActive ?? brand.isActive,
      updatedAt: new Date(),
    });

    return (
      (await this.brandRepo.getBrandById(data.tenantId, data.brandId)) ?? brand
    );
  }
}

export class DeleteBrandUseCase {
  constructor(
    private brandRepo: BrandRepository,
    private modelRepo: ModelRepository,
  ) {}

  async execute(data: DeleteBrandInput): Promise<void> {
    const brand = await this.brandRepo.getBrandById(
      data.tenantId,
      data.brandId,
    );
    if (!brand) {
      throw new Error("La marca no existe para este tenant.");
    }

    const models = await this.modelRepo.getModelsByBrand(
      data.tenantId,
      data.brandId,
    );
    if (models.length > 0) {
      throw new Error(
        `No se puede eliminar la marca "${brand.name}" porque tiene ${models.length} modelo(s) asociado(s).`,
      );
    }

    await this.brandRepo.removeBrand(data.brandId);
  }
}

export class ListBrandsUseCase {
  constructor(private brandRepo: BrandRepository) {}

  async execute(
    tenantId: string,
    options?: ListBrandsOptions,
  ): Promise<Brand[]> {
    const includeInactive = options?.includeInactive ?? true;
    const brands = await this.brandRepo.getBrandsByTenant(tenantId);

    return brands
      .filter((brand) => includeInactive || brand.isActive)
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }
}
