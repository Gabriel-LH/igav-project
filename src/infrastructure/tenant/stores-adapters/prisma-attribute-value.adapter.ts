import { AttributeValueRepository } from "../../../domain/tenant/repositories/AttributeValueRepository";
import { AttributeValue } from "../../../types/attributes/type.attribute-value";
import prisma from "@/src/lib/prisma";

const normalizeHex = (hexColor?: string | null): string | undefined => {
  if (!hexColor) return undefined;
  const trimmed = hexColor.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export class PrismaAttributeValueAdapter implements AttributeValueRepository {
  private prisma = prisma;

  async addAttributeValue(attributeValue: AttributeValue): Promise<void> {
    await this.prisma.attributeValue.create({
      data: {
        id: attributeValue.id,
        tenantId: attributeValue.tenantId,
        code: attributeValue.code,
        value: attributeValue.value,
        attributeTypeId: attributeValue.attributeTypeId,
        hexColor: normalizeHex(attributeValue.hexColor) ?? "",
        isActive: attributeValue.isActive,
      },
    });
  }

  async updateAttributeValue(
    attributeValueId: string,
    updates: Partial<AttributeValue>,
  ): Promise<void> {
    await this.prisma.attributeValue.update({
      where: { id: attributeValueId },
      data: {
        code: updates.code,
        value: updates.value,
        attributeTypeId: updates.attributeTypeId,
        hexColor: normalizeHex(updates.hexColor) ?? "",
        isActive: updates.isActive,
      },
    });
  }

  async getAttributeValueById(
    tenantId: string,
    attributeValueId: string,
  ): Promise<AttributeValue | undefined> {
    const attributeValue = await this.prisma.attributeValue.findFirst({
      where: { id: attributeValueId, tenantId },
    });

    if (!attributeValue) return undefined;

    return {
      ...attributeValue,
      hexColor: normalizeHex(attributeValue.hexColor),
    };
  }

  async getAttributeValuesByTenant(
    tenantId: string,
  ): Promise<AttributeValue[]> {
    const values = await this.prisma.attributeValue.findMany({
      where: { tenantId },
      orderBy: { value: "asc" },
    });

    return values.map((value) => ({
      ...value,
      hexColor: normalizeHex(value.hexColor),
    }));
  }

  async getAttributeValuesByType(
    tenantId: string,
    attributeTypeId: string,
  ): Promise<AttributeValue[]> {
    const values = await this.prisma.attributeValue.findMany({
      where: { tenantId, attributeTypeId },
      orderBy: { value: "asc" },
    });

    return values.map((value) => ({
      ...value,
      hexColor: normalizeHex(value.hexColor),
    }));
  }

  async markAsActive(attributeValueId: string): Promise<void> {
    await this.prisma.attributeValue.update({
      where: { id: attributeValueId },
      data: { isActive: true },
    });
  }

  async markAsInactive(attributeValueId: string): Promise<void> {
    await this.prisma.attributeValue.update({
      where: { id: attributeValueId },
      data: { isActive: false },
    });
  }

  async removeAttributeValue(attributeValueId: string): Promise<void> {
    await this.prisma.attributeValue.delete({
      where: { id: attributeValueId },
    });
  }
}
