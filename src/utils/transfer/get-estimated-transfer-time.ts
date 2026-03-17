import { BusinessRules } from "@/src/types/bussines-rules/bussines-rules"; 

export const getEstimatedTransferTime = (
  fromId: string,
  toId: string,
  rules: BusinessRules,
) => {
  const route = (rules as any).transferRoutes?.find(
    (r: any) =>
      (r.originBranchId === fromId && r.destinationBranchId === toId) ||
      (r.originBranchId === toId && r.destinationBranchId === fromId),
  );

  return route ? (route.estimatedTime || route.estimatedTimeHours) : (rules.defaultTransferTime ?? 2);
};