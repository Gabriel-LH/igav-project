"use client";

import { useEffect } from "react";
import { useCashSessionStore } from "@/src/store/useCashSessionStore";
import { CashSession } from "@/src/types/cash/type.cash";

export function CashSessionHydrator({ data }: { data: CashSession[] }) {
  const setSessions = useCashSessionStore((state) => state.setSessions);

  useEffect(() => {
    if (data) {
      setSessions(data);
    }
  }, [data, setSessions]);

  return null;
}
