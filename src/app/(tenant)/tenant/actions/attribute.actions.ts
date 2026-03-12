"use server";

import { revalidatePath } from "next/cache";
import { requireTenantMembership } from "@/src/infrastructure/tenant/auth.guard";
import { PrismaAttributeTypeAdapter } from "@/src/infrastructure/tenant/stores-adapters/prisma-attribute-type.adapter";
import { PrismaAttributeValueAdapter } from "@/src/infrastructure/tenant/stores-adapters/prisma-attribute-value.adapter";
import {
  CreateAttributeTypeUseCase,
  DeleteAttributeTypeUseCase,
  ListAttributeTypesUseCase,
  UpdateAttributeTypeUseCase,
} from "@/src/application/tenant/use-cases/crudAttributeType.usecase";
import {
  CreateAttributeValueUseCase,
  DeleteAttributeValueUseCase,
  ListAttributeValuesUseCase,
  UpdateAttributeValueUseCase,
} from "@/src/application/tenant/use-cases/crudAttributeValue.usecase";
import { AttributeTypeFormData } from "@/src/types/attributes/type.attribute-type";
import { AttributeValueFormData } from "@/src/types/attributes/type.attribute-value";

const revalidateCatalogs = () => {
  revalidatePath("/tenant/inventory/catalogs");
  revalidatePath("/tenant/catalogs/attributes");
  revalidatePath("/tenant/catalogs/values");
};

// Attribute Types
export async function getAttributeTypesAction() {
  try {
    const membership = await requireTenantMembership();
    const tenantId = membership.tenantId;
    if (!tenantId) {
      throw new Error("El ID del tenant es obligatorio.");
    }

    const attributeTypeRepo = new PrismaAttributeTypeAdapter();
    const listAttributeTypesUseCase = new ListAttributeTypesUseCase(
      attributeTypeRepo,
    );

    const types = await listAttributeTypesUseCase.execute(tenantId, {
      includeInactive: true,
    });

    return { success: true, data: types };
  } catch (error) {
    console.error("Error al obtener tipos de atributo:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al obtener tipos de atributo",
    };
  }
}

export async function createAttributeTypeAction(formData: AttributeTypeFormData) {
  try {
    const membership = await requireTenantMembership();
    const tenantId = membership.tenantId;
    if (!tenantId) {
      throw new Error("El ID del tenant es obligatorio.");
    }

    const attributeTypeRepo = new PrismaAttributeTypeAdapter();
    const createAttributeTypeUseCase = new CreateAttributeTypeUseCase(
      attributeTypeRepo,
    );

    const created = await createAttributeTypeUseCase.execute({
      tenantId,
      ...formData,
    });

    revalidateCatalogs();
    return { success: true, data: created };
  } catch (error) {
    console.error("Error al crear tipo de atributo:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al crear tipo de atributo",
    };
  }
}

export async function updateAttributeTypeAction(
  attributeTypeId: string,
  formData: AttributeTypeFormData,
) {
  try {
    const membership = await requireTenantMembership();
    const tenantId = membership.tenantId;
    if (!tenantId) {
      throw new Error("El ID del tenant es obligatorio.");
    }

    const attributeTypeRepo = new PrismaAttributeTypeAdapter();
    const updateAttributeTypeUseCase = new UpdateAttributeTypeUseCase(
      attributeTypeRepo,
    );

    const updated = await updateAttributeTypeUseCase.execute({
      tenantId,
      attributeTypeId,
      ...formData,
    });

    revalidateCatalogs();
    return { success: true, data: updated };
  } catch (error) {
    console.error("Error al actualizar tipo de atributo:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al actualizar tipo de atributo",
    };
  }
}

export async function deleteAttributeTypeAction(attributeTypeId: string) {
  try {
    const membership = await requireTenantMembership();
    const tenantId = membership.tenantId;
    if (!tenantId) {
      throw new Error("El ID del tenant es obligatorio.");
    }

    const attributeTypeRepo = new PrismaAttributeTypeAdapter();
    const attributeValueRepo = new PrismaAttributeValueAdapter();
    const deleteAttributeTypeUseCase = new DeleteAttributeTypeUseCase(
      attributeTypeRepo,
      attributeValueRepo,
    );

    await deleteAttributeTypeUseCase.execute({ tenantId, attributeTypeId });

    revalidateCatalogs();
    return { success: true };
  } catch (error) {
    console.error("Error al eliminar tipo de atributo:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al eliminar tipo de atributo",
    };
  }
}

// Attribute Values
export async function getAttributeValuesAction(attributeTypeId?: string) {
  try {
    const membership = await requireTenantMembership();
    const tenantId = membership.tenantId;
    if (!tenantId) {
      throw new Error("El ID del tenant es obligatorio.");
    }

    const attributeValueRepo = new PrismaAttributeValueAdapter();
    const listAttributeValuesUseCase = new ListAttributeValuesUseCase(
      attributeValueRepo,
    );

    const values = await listAttributeValuesUseCase.execute(tenantId, {
      includeInactive: true,
      attributeTypeId,
    });

    return { success: true, data: values };
  } catch (error) {
    console.error("Error al obtener valores de atributo:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al obtener valores de atributo",
    };
  }
}

export async function createAttributeValueAction(
  formData: AttributeValueFormData,
) {
  try {
    const membership = await requireTenantMembership();
    const tenantId = membership.tenantId;
    if (!tenantId) {
      throw new Error("El ID del tenant es obligatorio.");
    }

    const attributeValueRepo = new PrismaAttributeValueAdapter();
    const attributeTypeRepo = new PrismaAttributeTypeAdapter();
    const createAttributeValueUseCase = new CreateAttributeValueUseCase(
      attributeValueRepo,
      attributeTypeRepo,
    );

    const created = await createAttributeValueUseCase.execute({
      tenantId,
      ...formData,
    });

    revalidateCatalogs();
    return { success: true, data: created };
  } catch (error) {
    console.error("Error al crear valor de atributo:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al crear valor de atributo",
    };
  }
}

export async function updateAttributeValueAction(
  attributeValueId: string,
  formData: AttributeValueFormData,
) {
  try {
    const membership = await requireTenantMembership();
    const tenantId = membership.tenantId;
    if (!tenantId) {
      throw new Error("El ID del tenant es obligatorio.");
    }

    const attributeValueRepo = new PrismaAttributeValueAdapter();
    const attributeTypeRepo = new PrismaAttributeTypeAdapter();
    const updateAttributeValueUseCase = new UpdateAttributeValueUseCase(
      attributeValueRepo,
      attributeTypeRepo,
    );

    const updated = await updateAttributeValueUseCase.execute({
      tenantId,
      attributeValueId,
      ...formData,
    });

    revalidateCatalogs();
    return { success: true, data: updated };
  } catch (error) {
    console.error("Error al actualizar valor de atributo:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al actualizar valor de atributo",
    };
  }
}

export async function deleteAttributeValueAction(attributeValueId: string) {
  try {
    const membership = await requireTenantMembership();
    const tenantId = membership.tenantId;
    if (!tenantId) {
      throw new Error("El ID del tenant es obligatorio.");
    }

    const attributeValueRepo = new PrismaAttributeValueAdapter();
    const deleteAttributeValueUseCase = new DeleteAttributeValueUseCase(
      attributeValueRepo,
    );

    await deleteAttributeValueUseCase.execute({
      tenantId,
      attributeValueId,
    });

    revalidateCatalogs();
    return { success: true };
  } catch (error) {
    console.error("Error al eliminar valor de atributo:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al eliminar valor de atributo",
    };
  }
}
