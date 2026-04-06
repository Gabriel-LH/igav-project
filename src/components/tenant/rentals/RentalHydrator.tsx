"use client";

import { useEffect } from "react";
import { useRentalStore } from "@/src/store/useRentalStore";

export function RentalHydrator({ data }: { data: any[] }) {
  const setRentalData = useRentalStore((state) => state.setRentalData);

  useEffect(() => {
    if (data) {
      setRentalData(data as any, []);
    }
  }, [data, setRentalData]);

  return null;
}
