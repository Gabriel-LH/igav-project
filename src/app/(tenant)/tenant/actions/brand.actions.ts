"use server";

import { PrismaBrandAdapter } from "@/src/infrastructure/tenant/stores-adapters/prisma-brand.adapter";
import { PrismaModelAdapter } from "@/src/infrastructure/tenant/stores-adapters/prisma-model.adapter";
import {
  CreateBrandUseCase,
  UpdateBrandUseCase,
  DeleteBrandUseCase,
  ListBrandsUseCase,
} from "@/src/application/tenant/use-cases/brand/crudBrand.usecase";
import {
  CreateModelUseCase,
  UpdateModelUseCase,
  DeleteModelUseCase,
  ListModelsUseCase,
} from "@/src/application/tenant/use-cases/crudModel.usecase";
import { requireTenantMembership } from "@/src/infrastructure/tenant/auth.guard";
import { BrandFormData } from "@/src/types/brand/type.brand";
import { CreateModelInput } from "@/src/application/interfaces/CreateModelInput";
import { UpdateModelInput } from "@/src/application/interfaces/UpdateModelInput";
import { revalidatePath } from "next/cache";

// --- Brand Actions ---

export async function getBrandsAction() {
  try {
    const membership = await requireTenantMembership();
    const tenantId = membership.tenantId;

    if (!tenantId) {
      throw new Error("El ID del tenant es obligatorio.");
    }

    const brandRepo = new PrismaBrandAdapter();
    const listBrandsUseCase = new ListBrandsUseCase(brandRepo);

    const brands = await listBrandsUseCase.execute(tenantId);

    return { success: true, data: brands };
  } catch (error) {
    console.error("Error al obtener marcas:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al obtener marcas",
    };
  }
}

export async function createBrandAction(formData: BrandFormData) {
  try {
    const membership = await requireTenantMembership();
    const tenantId = membership.tenantId;

    if (!tenantId) {
      throw new Error("El ID del tenant es obligatorio.");
    }

    const brandRepo = new PrismaBrandAdapter();
    const createBrandUseCase = new CreateBrandUseCase(brandRepo);

    const brand = await createBrandUseCase.execute({
      ...formData,
      tenantId,
    });

    revalidatePath("/tenant/inventory/catalogs");
    return { success: true, data: brand };
  } catch (error) {
    console.error("Error al crear marca:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al crear marca",
    };
  }
}

export async function updateBrandAction(
  brandId: string,
  formData: BrandFormData,
) {
  try {
    const membership = await requireTenantMembership();
    const tenantId = membership.tenantId;

    if (!tenantId) {
      throw new Error("El ID del tenant es obligatorio.");
    }

    const brandRepo = new PrismaBrandAdapter();
    const updateBrandUseCase = new UpdateBrandUseCase(brandRepo);

    const brand = await updateBrandUseCase.execute({
      ...formData,
      brandId,
      tenantId,
    });

    revalidatePath("/tenant/inventory/catalogs");
    return { success: true, data: brand };
  } catch (error) {
    console.error("Error al actualizar marca:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al actualizar marca",
    };
  }
}

export async function deleteBrandAction(brandId: string) {
  try {
    const membership = await requireTenantMembership();
    const tenantId = membership.tenantId;

    if (!tenantId) {
      throw new Error("El ID del tenant es obligatorio.");
    }

    const brandRepo = new PrismaBrandAdapter();
    const modelRepo = new PrismaModelAdapter();
    const deleteBrandUseCase = new DeleteBrandUseCase(brandRepo, modelRepo);

    await deleteBrandUseCase.execute({
      tenantId,
      brandId,
    });

    revalidatePath("/tenant/inventory/catalogs");
    return { success: true };
  } catch (error) {
    console.error("Error al eliminar marca:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al eliminar marca",
    };
  }
}

// --- Model Actions ---

export async function getModelsAction(brandId?: string) {
  try {
    const membership = await requireTenantMembership();
    const tenantId = membership.tenantId;

    if (!tenantId) {
      throw new Error("El ID del tenant es obligatorio.");
    }

    const modelRepo = new PrismaModelAdapter();
    const listModelsUseCase = new ListModelsUseCase(modelRepo);

    const models = await listModelsUseCase.execute(tenantId, { brandId });

    return { success: true, data: models };
  } catch (error) {
    console.error("Error al obtener modelos:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al obtener modelos",
    };
  }
}

export async function createModelAction(
  data: Omit<CreateModelInput, "tenantId">,
) {
  try {
    const membership = await requireTenantMembership();
    const tenantId = membership.tenantId;

    if (!tenantId) {
      throw new Error("El ID del tenant es obligatorio.");
    }

    const modelRepo = new PrismaModelAdapter();
    const brandRepo = new PrismaBrandAdapter();
    const createModelUseCase = new CreateModelUseCase(modelRepo, brandRepo);

    const model = await createModelUseCase.execute({
      ...data,
      tenantId,
    });

    revalidatePath("/tenant/inventory/catalogs");
    return { success: true, data: model };
  } catch (error) {
    console.error("Error al crear modelo:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al crear modelo",
    };
  }
}

export async function updateModelAction(
  data: Omit<UpdateModelInput, "tenantId">,
) {
  try {
    const membership = await requireTenantMembership();
    const tenantId = membership.tenantId;

    if (!tenantId) {
      throw new Error("El ID del tenant es obligatorio.");
    }

    const modelRepo = new PrismaModelAdapter();
    const brandRepo = new PrismaBrandAdapter();
    const updateModelUseCase = new UpdateModelUseCase(modelRepo, brandRepo);

    const model = await updateModelUseCase.execute({
      ...data,
      tenantId,
    });

    revalidatePath("/tenant/inventory/catalogs");
    return { success: true, data: model };
  } catch (error) {
    console.error("Error al actualizar modelo:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al actualizar modelo",
    };
  }
}

export async function deleteModelAction(modelId: string) {
  try {
    const membership = await requireTenantMembership();
    const tenantId = membership.tenantId;

    if (!tenantId) {
      throw new Error("El ID del tenant es obligatorio.");
    }

    const modelRepo = new PrismaModelAdapter();
    const deleteModelUseCase = new DeleteModelUseCase(modelRepo);

    await deleteModelUseCase.execute({
      tenantId,
      modelId,
    });

    revalidatePath("/tenant/inventory/catalogs");
    return { success: true };
  } catch (error) {
    console.error("Error al eliminar modelo:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al eliminar modelo",
    };
  }
}
