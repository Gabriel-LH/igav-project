import { AttributeTypeRepository } from "../../../domain/tenant/repositories/AttributeTypeRepository";
import { AttributeType } from "../../../types/attributes/type.attribute-type";
import prisma from "@/src/lib/prisma";

export class PrismaAttributeTypeAdapter implements AttributeTypeRepository {
  private prisma = prisma;

  async addAttributeType(attributeType: AttributeType): Promise<void> {
    await this.prisma.attributeType.create({
      data: {
        id: attributeType.id,
        tenantId: attributeType.tenantId,
        name: attributeType.name,
        code: attributeType.code,
        inputType: attributeType.inputType,
        isVariant: attributeType.isVariant,
        affectsSku: attributeType.affectsSku,
        isActive: attributeType.isActive,
      },
    });
  }

  async updateAttributeType(
    tenantId: string,
    attributeTypeId: string,
    updates: Partial<AttributeType>,
  ): Promise<void> {
    void tenantId;
    await this.prisma.attributeType.update({
      where: { id: attributeTypeId },
      data: {
        name: updates.name,
        code: updates.code,
        inputType: updates.inputType,
        isVariant: updates.isVariant,
        affectsSku: updates.affectsSku,
        isActive: updates.isActive,
      },
    });
  }

  async getAttributeTypeById(
    tenantId: string,
    attributeTypeId: string,
  ): Promise<AttributeType | undefined> {
    const attributeType = await this.prisma.attributeType.findFirst({
      where: { id: attributeTypeId, tenantId },
    });

    return attributeType ?? undefined;
  }

  async getAttributeTypesByTenant(
    tenantId: string,
  ): Promise<AttributeType[]> {
    return this.prisma.attributeType.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
    });
  }

  async markAsActive(
    tenantId: string,
    attributeTypeId: string,
  ): Promise<void> {
    void tenantId;
    await this.prisma.attributeType.update({
      where: { id: attributeTypeId },
      data: { isActive: true },
    });
  }

  async markAsInactive(
    tenantId: string,
    attributeTypeId: string,
  ): Promise<void> {
    void tenantId;
    await this.prisma.attributeType.update({
      where: { id: attributeTypeId },
      data: { isActive: false },
    });
  }

  async removeAttributeType(
    tenantId: string,
    attributeTypeId: string,
  ): Promise<void> {
    void tenantId;
    await this.prisma.attributeType.delete({
      where: { id: attributeTypeId },
    });
  }
}
