"use server";

import { PromotionHeader } from "@/src/components/tenant/inventory/promotions/promotion-header";
import { PromotionList } from "@/src/components/tenant/inventory/promotions/promotion-list";
import { getPromotionsAction } from "@/src/app/(tenant)/tenant/actions/promotion.actions";
import { getCategoriesAction } from "@/src/app/(tenant)/tenant/actions/category.actions";
import { Category } from "@/src/types/category/type.category";

export default async function PromotionsPage() {
  const [promotionsRes, categoriesRes] = await Promise.all([
    getPromotionsAction(true),
    getCategoriesAction(),
  ]);

  const promotions = promotionsRes.success ? promotionsRes.data || [] : [];
  const categories = categoriesRes.success ? (categoriesRes.data as Category[]) : [];

  return (
    <div className="flex flex-col gap-6 p-6">
      <PromotionHeader />
      <PromotionList initialPromotions={promotions} categories={categories} />
    </div>
  );
}
