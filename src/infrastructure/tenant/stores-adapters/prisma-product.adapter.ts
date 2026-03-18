import { ProductRepository } from "../../../domain/tenant/repositories/ProductRepository";
import { Product } from "../../../types/product/type.product";
import { ProductVariant } from "../../../types/product/type.productVariant";
import prisma from "@/src/lib/prisma";

export class PrismaProductAdapter implements ProductRepository {
  private prisma = prisma;

  private mapToPrismaRentUnit(unit?: string): any {
    if (!unit) return null;
    const map: Record<string, string> = {
      hora: "hora",
      día: "dia",
      semana: "semana",
      mes: "mes",
      evento: "evento",
    };
    return map[unit.toLowerCase()] || null;
  }

  private mapFromPrismaRentUnit(unit?: any): string | undefined {
    if (!unit) return undefined;
    const map: Record<string, string> = {
      hora: "hora",
      dia: "día",
      semana: "semana",
      mes: "mes",
      evento: "evento",
    };
    return map[unit];
  }

  async createProduct(product: Product): Promise<void> {
    await this.prisma.product.create({
      data: {
        id: product.id,
        tenantId: product.tenantId,
        name: product.name,
        image: product.image,
        baseSku: product.baseSku,
        modelId: product.modelId,
        categoryId: product.categoryId,
        description: product.description,
        is_serial: product.is_serial,
        can_rent: product.can_rent,
        can_sell: product.can_sell,
        createdBy: product.createdBy,
        updatedBy: product.updatedBy,
      },
    });
  }

  async updateProduct(productId: string, updates: Partial<Product>): Promise<void> {
    await this.prisma.product.update({
      where: { id: productId },
      data: {
        name: updates.name,
        image: updates.image,
        baseSku: updates.baseSku,
        modelId: updates.modelId,
        categoryId: updates.categoryId,
        description: updates.description,
        is_serial: updates.is_serial,
        can_rent: updates.can_rent,
        can_sell: updates.can_sell,
        updatedAt: new Date(),
        updatedBy: updates.updatedBy,
        isDeleted: updates.isDeleted,
        deletedAt: updates.deletedAt,
        deletedBy: updates.deletedBy,
        deleteReason: updates.deleteReason,
      },
    });
  }

  async getProductById(tenantId: string, productId: string): Promise<Product | null> {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenantId },
    });
    if (!product) return null;
    return {
      ...product,
      image: (product.image as string[]) || [],
      description: product.description || undefined,
      createdBy: product.createdBy || undefined,
      updatedBy: product.updatedBy || undefined,
    } as unknown as Product;
  }

  async getProductsByTenant(
    tenantId: string,
    opts?: { includeDeleted?: boolean },
  ): Promise<Product[]> {
    const products = await this.prisma.product.findMany({
      where: {
        tenantId,
        isDeleted: opts?.includeDeleted ? undefined : false,
      },
      orderBy: { createdAt: "desc" },
    });
    return products.map(
      (p: any) =>
        ({
          ...p,
          image: (p.image as string[]) || [],
          description: p.description || undefined,
          createdBy: p.createdBy || undefined,
          updatedBy: p.updatedBy || undefined,
        }) as unknown as Product,
    );
  }

  async softDeleteProduct(productId: string, deletedBy: string): Promise<void> {
    await this.prisma.product.update({
      where: { id: productId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy,
      },
    });
  }

  async createVariants(variants: ProductVariant[]): Promise<void> {
    await this.prisma.productVariant.createMany({
      data: variants.map((v) => ({
        id: v.id,
        tenantId: v.tenantId,
        productId: v.productId,
        variantCode: v.variantCode,
        variantSignature: v.variantSignature,
        barcode: v.barcode,
        attributes: v.attributes as any,
        purchasePrice: v.purchasePrice,
        priceSell: v.priceSell,
        priceRent: v.priceRent,
        rentUnit: this.mapToPrismaRentUnit(v.rentUnit),
        image: v.image,
        isActive: v.isActive,
      })),
    });
  }

  private buildSignatureFromAttributes(attrs: Record<string, string>): string {
    return Object.entries(attrs)
      .map(([k, val]) => `${k}:${val}`)
      .join("|");
  }

  async getVariantsByProductId(productId: string): Promise<ProductVariant[]> {
    const variants = await this.prisma.productVariant.findMany({
      where: { productId },
    });
    return variants.map(
      (v: any) => {
        const attrs = (v.attributes as Record<string, string>) || {};
        return {
          ...v,
          image: (v.image as string[]) || [],
          attributes: attrs,
          variantSignature: v.variantSignature || this.buildSignatureFromAttributes(attrs),
          rentUnit: this.mapFromPrismaRentUnit(v.rentUnit),
          purchasePrice: v.purchasePrice ?? 0,
          priceSell: v.priceSell ?? 0,
          priceRent: v.priceRent ?? 0,
        } as unknown as ProductVariant;
      },
    );
  }

  async getVariantsByTenant(tenantId: string): Promise<ProductVariant[]> {
    const variants = await this.prisma.productVariant.findMany({
      where: { tenantId },
    });
    return variants.map(
      (v: any) => {
        const attrs = (v.attributes as Record<string, string>) || {};
        return {
          ...v,
          image: (v.image as string[]) || [],
          attributes: attrs,
          variantSignature: v.variantSignature || this.buildSignatureFromAttributes(attrs),
          rentUnit: this.mapFromPrismaRentUnit(v.rentUnit),
          purchasePrice: v.purchasePrice ?? 0,
          priceSell: v.priceSell ?? 0,
          priceRent: v.priceRent ?? 0,
        } as unknown as ProductVariant;
      },
    );
  }

  async updateVariant(
    variantId: string,
    updates: Partial<ProductVariant>,
  ): Promise<void> {
    // Build variantSignature from attributes if attributes are being updated
    const signature = updates.attributes
      ? this.buildSignatureFromAttributes(updates.attributes as Record<string, string>)
      : undefined;

    await this.prisma.productVariant.update({
      where: { id: variantId },
      data: {
        variantCode: updates.variantCode,
        variantSignature: signature,
        barcode: updates.barcode,
        attributes: updates.attributes as any,
        purchasePrice: updates.purchasePrice,
        priceSell: updates.priceSell,
        priceRent: updates.priceRent,
        rentUnit: this.mapToPrismaRentUnit(updates.rentUnit),
        image: updates.image,
        isActive: updates.isActive,
        updatedAt: new Date(),
      },
    });
  }

  async deleteVariantsByProductId(productId: string): Promise<void> {
    await this.prisma.productVariant.deleteMany({
      where: { productId },
    });
  }
}
