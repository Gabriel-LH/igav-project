import type { TenantConfig } from "@/src/types/tenant/type.tenantConfig";

export const getEstimatedTransferTime = (
  fromId: string,
  toId: string,
  rules: Pick<TenantConfig, "defaultTransferTime" | "transferRoutes">,
) => {
  const route = rules.transferRoutes?.find(
    (r) =>
      (r.originBranchId === fromId && r.destinationBranchId === toId) ||
      (r.originBranchId === toId && r.destinationBranchId === fromId),
  );

  return route?.status === "active"
    ? route.estimatedTimeHours
    : (rules.defaultTransferTime ?? 2);
};
