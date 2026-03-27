"use client";

import { useEffect } from "react";
import { usePromotionStore } from "@/src/store/usePromotionStore";
import { Promotion } from "@/src/types/promotion/type.promotion";

export function PromotionHydrator({ data }: { data: Promotion[] }) {
  const setPromotions = usePromotionStore((state) => state.setPromotions);

  useEffect(() => {
    if (data) {
      setPromotions(data);
    }
  }, [data, setPromotions]);

  return null;
}
