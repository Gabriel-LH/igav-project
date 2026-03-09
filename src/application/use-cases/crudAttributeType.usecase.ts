import { CreateAttributeTypeInput } from "../interfaces/CreateAttributeTypeInput";
import { UpdateAttributeTypeInput } from "../interfaces/UpdateAttributeTypeInput";
import { AttributeTypeRepository } from "../../domain/repositories/AttributeTypeRepository";
import { AttributeValueRepository } from "../../domain/repositories/AttributeValueRepository";
import { AttributeType } from "../../types/attributes/type.attribute-type";

interface DeleteAttributeTypeInput {
  tenantId: string;
  attributeTypeId: string;
}

interface ListAttributeTypesOptions {
  includeInactive?: boolean;
}

export class CreateAttributeTypeUseCase {
  constructor(private attributeTypeRepo: AttributeTypeRepository) {}

  execute(data: CreateAttributeTypeInput): AttributeType {
    const attributeTypes = this.attributeTypeRepo.getAttributeTypesByTenant(
      data.tenantId,
    );
    const code = data.code.trim().toUpperCase();

    if (attributeTypes.some((attributeType) => attributeType.code === code)) {
      throw new Error("Ya existe un tipo de atributo con ese código.");
    }

    const attributeType: AttributeType = {
      id: `attr-type-${crypto.randomUUID()}`,
      tenantId: data.tenantId,
      name: data.name,
      code,
      inputType: data.inputType,
      isVariant: data.isVariant,
      affectsSku: data.affectsSku,
      isActive: data.isActive,
    };

    this.attributeTypeRepo.addAttributeType(attributeType);
    return attributeType;
  }
}

export class UpdateAttributeTypeUseCase {
  constructor(private attributeTypeRepo: AttributeTypeRepository) {}

  execute(data: UpdateAttributeTypeInput): AttributeType {
    const attributeType = this.attributeTypeRepo.getAttributeTypeById(
      data.tenantId,
      data.attributeTypeId,
    );

    if (!attributeType) {
      throw new Error("El tipo de atributo no existe para este tenant.");
    }

    const attributeTypes = this.attributeTypeRepo
      .getAttributeTypesByTenant(data.tenantId)
      .filter((item) => item.id !== data.attributeTypeId);
    const nextCode = (data.code ?? attributeType.code).trim().toUpperCase();

    if (attributeTypes.some((item) => item.code === nextCode)) {
      throw new Error("Ya existe un tipo de atributo con ese código.");
    }

    this.attributeTypeRepo.updateAttributeType(
      data.tenantId,
      data.attributeTypeId,
      {
        name: data.name ?? attributeType.name,
        code: nextCode,
        inputType: data.inputType ?? attributeType.inputType,
        isVariant: data.isVariant ?? attributeType.isVariant,
        affectsSku: data.affectsSku ?? attributeType.affectsSku,
        isActive: data.isActive ?? attributeType.isActive,
      },
    );

    return (
      this.attributeTypeRepo.getAttributeTypeById(
        data.tenantId,
        data.attributeTypeId,
      ) ?? attributeType
    );
  }
}

export class DeleteAttributeTypeUseCase {
  constructor(
    private attributeTypeRepo: AttributeTypeRepository,
    private attributeValueRepo: AttributeValueRepository,
  ) {}

  execute(data: DeleteAttributeTypeInput): void {
    const attributeType = this.attributeTypeRepo.getAttributeTypeById(
      data.tenantId,
      data.attributeTypeId,
    );
    if (!attributeType) {
      throw new Error("El tipo de atributo no existe para este tenant.");
    }

    const values = this.attributeValueRepo.getAttributeValuesByType(
      data.tenantId,
      data.attributeTypeId,
    );
    if (values.length > 0) {
      throw new Error(
        `No se puede eliminar "${attributeType.name}" porque tiene ${values.length} valor(es) asociados.`,
      );
    }

    this.attributeTypeRepo.removeAttributeType(
      data.tenantId,
      data.attributeTypeId,
    );
  }
}

export class ListAttributeTypesUseCase {
  constructor(private attributeTypeRepo: AttributeTypeRepository) {}

  execute(
    tenantId: string,
    options?: ListAttributeTypesOptions,
  ): AttributeType[] {
    const includeInactive = options?.includeInactive ?? true;
    return this.attributeTypeRepo
      .getAttributeTypesByTenant(tenantId)
      .filter((attributeType) => includeInactive || attributeType.isActive)
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }
}
