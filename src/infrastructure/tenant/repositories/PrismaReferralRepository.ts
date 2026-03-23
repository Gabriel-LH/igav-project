import { PrismaClient, Prisma } from "@/prisma/generated/client";
import { ReferralRepository } from "@/src/domain/tenant/repositories/ReferralRepository";
import { Referral } from "@/src/types/referral/type.referral";

export class PrismaReferralRepository implements ReferralRepository {
  constructor(
    private readonly prisma: PrismaClient | Prisma.TransactionClient,
  ) {}

  async processReferrals(
    customerId: string,
    tenantId: string,
    trigger: "first_purchase" | "first_rental" | "account_creation",
  ): Promise<Referral | undefined> {
    void customerId;
    void tenantId;
    void trigger;

    // Only return defined if we want to mimic the current mock behavior.
    return undefined;
  }

  async addReferral(referral: Referral): Promise<void> {
    await this.prisma.referral.create({
      data: {
        id: referral.id,
        tenantId: referral.tenantId,
        referrerClientId: referral.referrerClientId,
        referredClientId: referral.referredClientId,
        status: referral.status,
        createdAt: referral.createdAt,
        rewardedAt: referral.rewardedAt ?? null,
      },
    });
  }
}
