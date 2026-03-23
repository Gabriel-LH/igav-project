import {
  Coupon as PrismaCouponRecord,
  CouponOrigin,
  CouponStatus,
  DiscountType,
  Prisma,
  PrismaClient,
} from "@/prisma/generated/client";
import { CouponRepository } from "@/src/domain/tenant/repositories/CouponRepository";
import { Coupon as DomainCoupon } from "@/src/types/coupon/type.coupon";

const mapPrismaCoupon = (coupon: PrismaCouponRecord): DomainCoupon => ({
  id: coupon.id,
  tenantId: coupon.tenantId,
  code: coupon.code,
  discountType: coupon.discountType,
  discountValue: coupon.discountValue,
  minPurchaseAmount: coupon.minPurchaseAmount ?? undefined,
  assignedToClientId: coupon.assignedToClientId,
  origin: coupon.origin,
  originReferenceId: coupon.originReferenceId ?? undefined,
  status: coupon.status,
  expiresAt: coupon.expiresAt,
  createdAt: coupon.createdAt,
  usedAt: coupon.usedAt,
});

export class PrismaCouponRepository implements CouponRepository {
  constructor(
    private readonly prisma: PrismaClient | Prisma.TransactionClient,
  ) {}

  async addCoupon(coupon: DomainCoupon): Promise<void> {
    await this.prisma.coupon.create({
      data: {
        id: coupon.id,
        tenantId: coupon.tenantId,
        code: coupon.code,
        discountType: coupon.discountType as DiscountType,
        discountValue: coupon.discountValue,
        minPurchaseAmount: coupon.minPurchaseAmount || null,
        assignedToClientId: coupon.assignedToClientId,
        origin: coupon.origin as CouponOrigin,
        originReferenceId: coupon.originReferenceId || null,
        status: coupon.status as CouponStatus,
        expiresAt: coupon.expiresAt || null,
        usedAt: coupon.usedAt || null,
        createdAt: coupon.createdAt || new Date(),
      },
    });
  }

  async getCouponsByTenant(tenantId: string): Promise<DomainCoupon[]> {
    const coupons = await this.prisma.coupon.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });

    return coupons.map(mapPrismaCoupon);
  }

  async getCouponByCode(code: string): Promise<DomainCoupon | undefined> {
    const coupon = await this.prisma.coupon.findFirst({
      where: { code },
    });

    return coupon ? mapPrismaCoupon(coupon) : undefined;
  }

  async getCouponsByClientIds(
    tenantId: string,
    clientIds: string[],
  ): Promise<DomainCoupon[]> {
    if (clientIds.length === 0) {
      return [];
    }

    const coupons = await this.prisma.coupon.findMany({
      where: {
        tenantId,
        assignedToClientId: {
          in: clientIds,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return coupons.map(mapPrismaCoupon);
  }
}
