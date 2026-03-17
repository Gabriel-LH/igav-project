import { CreateAttributeValueInput } from "../../interfaces/CreateAttributeValueInput";
import { UpdateAttributeValueInput } from "../../interfaces/UpdateAttributeValueInput";
import { AttributeTypeRepository } from "../../../domain/tenant/repositories/AttributeTypeRepository";
import { AttributeValueRepository } from "../../../domain/tenant/repositories/AttributeValueRepository";
import { AttributeValue } from "../../../types/attributes/type.attribute-value";

interface DeleteAttributeValueInput {
  tenantId: string;
  attributeValueId: string;
}

interface ListAttributeValuesOptions {
  includeInactive?: boolean;
  attributeTypeId?: string;
}

const normalizeHex = (hexColor?: string): string | undefined => {
  if (!hexColor) return undefined;
  return hexColor.trim().toUpperCase();
};

const isHexValid = (hexColor: string): boolean =>
  /^#([A-F0-9]{6}|[A-F0-9]{3})$/.test(hexColor);

export class CreateAttributeValueUseCase {
  constructor(
    private attributeValueRepo: AttributeValueRepository,
    private attributeTypeRepo: AttributeTypeRepository,
  ) {}

  async execute(data: CreateAttributeValueInput): Promise<AttributeValue> {
    const attributeType = await this.attributeTypeRepo.getAttributeTypeById(
      data.tenantId,
      data.attributeTypeId,
    );
    if (!attributeType) {
      throw new Error("El tipo de atributo seleccionado no existe.");
    }

    const values = await this.attributeValueRepo.getAttributeValuesByTenant(
      data.tenantId,
    );
    const code = data.code.trim().toUpperCase();
    const repeatedInType = values.some(
      (value) =>
        value.attributeTypeId === data.attributeTypeId &&
        value.code.toUpperCase() === code,
    );
    if (repeatedInType) {
      throw new Error(
        "Ya existe un valor con ese código para este tipo de atributo.",
      );
    }

    const hexColor =
      attributeType.inputType === "color"
        ? normalizeHex(data.hexColor)
        : undefined;
    if (
      attributeType.inputType === "color" &&
      hexColor &&
      !isHexValid(hexColor)
    ) {
      throw new Error("El color hexadecimal no es válido.");
    }

    const attributeValue: AttributeValue = {
      id: `attr-value-${crypto.randomUUID()}`,
      tenantId: data.tenantId,
      code,
      value: data.value,
      attributeTypeId: data.attributeTypeId,
      hexColor,
      isActive: data.isActive,
    };

    await this.attributeValueRepo.addAttributeValue(attributeValue);
    return attributeValue;
  }
}

export class UpdateAttributeValueUseCase {
  constructor(
    private attributeValueRepo: AttributeValueRepository,
    private attributeTypeRepo: AttributeTypeRepository,
  ) {}

  async execute(data: UpdateAttributeValueInput): Promise<AttributeValue> {
    const attributeValue = await this.attributeValueRepo.getAttributeValueById(
      data.tenantId,
      data.attributeValueId,
    );
    if (!attributeValue) {
      throw new Error("El valor de atributo no existe para este tenant.");
    }

    const nextAttributeTypeId =
      data.attributeTypeId ?? attributeValue.attributeTypeId;
    const attributeType = await this.attributeTypeRepo.getAttributeTypeById(
      data.tenantId,
      nextAttributeTypeId,
    );
    if (!attributeType) {
      throw new Error("El tipo de atributo seleccionado no existe.");
    }

    const values = (await this.attributeValueRepo
      .getAttributeValuesByTenant(data.tenantId))
      .filter((item) => item.id !== data.attributeValueId);
    const nextCode = (data.code ?? attributeValue.code).trim().toUpperCase();
    const repeatedInType = values.some(
      (value) =>
        value.attributeTypeId === nextAttributeTypeId &&
        value.code.toUpperCase() === nextCode,
    );
    if (repeatedInType) {
      throw new Error(
        "Ya existe un valor con ese código para este tipo de atributo.",
      );
    }

    const nextHexColor =
      attributeType.inputType === "color"
        ? normalizeHex(data.hexColor ?? attributeValue.hexColor)
        : undefined;
    if (
      attributeType.inputType === "color" &&
      nextHexColor &&
      !isHexValid(nextHexColor)
    ) {
      throw new Error("El color hexadecimal no es válido.");
    }

    await this.attributeValueRepo.updateAttributeValue(data.attributeValueId, {
      code: nextCode,
      value: data.value ?? attributeValue.value,
      attributeTypeId: nextAttributeTypeId,
      hexColor: nextHexColor,
      isActive: data.isActive ?? attributeValue.isActive,
    });

    return (
      (await this.attributeValueRepo.getAttributeValueById(
        data.tenantId,
        data.attributeValueId,
      )) ?? attributeValue
    );
  }
}

export class DeleteAttributeValueUseCase {
  constructor(private attributeValueRepo: AttributeValueRepository) {}

  async execute(data: DeleteAttributeValueInput): Promise<void> {
    const attributeValue = await this.attributeValueRepo.getAttributeValueById(
      data.tenantId,
      data.attributeValueId,
    );
    if (!attributeValue) {
      throw new Error("El valor de atributo no existe para este tenant.");
    }

    await this.attributeValueRepo.removeAttributeValue(data.attributeValueId);
  }
}

export class ListAttributeValuesUseCase {
  constructor(private attributeValueRepo: AttributeValueRepository) {}

  async execute(
    tenantId: string,
    options?: ListAttributeValuesOptions,
  ): Promise<AttributeValue[]> {
    const includeInactive = options?.includeInactive ?? true;
    const attributeTypeId = options?.attributeTypeId;

    return (await this.attributeValueRepo
      .getAttributeValuesByTenant(tenantId))
      .filter((attributeValue) =>
        attributeTypeId
          ? attributeValue.attributeTypeId === attributeTypeId
          : true,
      )
      .filter((attributeValue) => includeInactive || attributeValue.isActive)
      .sort((a, b) => a.value.localeCompare(b.value, "es"));
  }
}
