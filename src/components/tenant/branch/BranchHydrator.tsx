"use client";

import { useEffect } from "react";
import { useBranchStore } from "@/src/store/useBranchStore";
import { Branch } from "@/src/types/branch/type.branch";

export function BranchHydrator({ data }: { data: Branch[] }) {
  const setBranches = useBranchStore((state) => state.setBranches);

  useEffect(() => {
    if (data) {
      setBranches(data);
    }
  }, [data, setBranches]);

  return null;
}
