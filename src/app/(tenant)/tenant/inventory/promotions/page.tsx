"use server";

import { PromotionHeader } from "@/src/components/tenant/inventory/promotions/promotion-header";
import { PromotionList } from "@/src/components/tenant/inventory/promotions/promotion-list";
import { getPromotionsAction } from "@/src/app/(tenant)/tenant/actions/promotion.actions";

export default async function PromotionsPage() {
  const promotionsRes = await getPromotionsAction(true);
  const promotions = promotionsRes.success ? promotionsRes.data || [] : [];

  return (
    <div className="flex flex-col gap-6 p-6">
      <PromotionHeader />
      <PromotionList initialPromotions={promotions} />
    </div>
  );
}
