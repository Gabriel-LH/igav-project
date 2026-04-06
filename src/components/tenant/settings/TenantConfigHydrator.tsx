"use client";

import { useEffect } from "react";
import { useTenantConfigStore } from "@/src/store/useTenantConfigStore";
import { TenantConfig } from "@/src/types/tenant/type.tenantConfig";

export function TenantConfigHydrator({ data }: { data: TenantConfig }) {
  const setConfig = useTenantConfigStore((state) => state.setConfig);

  useEffect(() => {
    if (data) {
      setConfig(data);
    }
  }, [data, setConfig]);

  return null;
}
