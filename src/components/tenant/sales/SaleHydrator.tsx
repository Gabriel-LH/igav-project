"use client";

import { useEffect } from "react";
import { useSaleStore } from "@/src/store/useSaleStore";

export function SaleHydrator({ data }: { data: any[] }) {
  const setSaleData = useSaleStore((state) => state.setSaleData);

  useEffect(() => {
    if (data) {
      // Note: We are hydrating with table data which might be maps of raw data
      // For the statistics in SalesTab, we just need saleDate and totalAmount/income
      setSaleData(data as any, []);
    }
  }, [data, setSaleData]);

  return null;
}
