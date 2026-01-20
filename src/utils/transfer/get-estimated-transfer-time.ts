import { BusinessRules } from "@/src/types/bussines-rules/bussines-rules"; 

export const getEstimatedTransferTime = (
  fromId: string,
  toId: string,
  rules: BusinessRules,
) => {
  const route = rules.transferRoutes.find(
    (r) =>
      (r.originBranchId === fromId && r.destinationBranchId === toId) ||
      (r.originBranchId === toId && r.destinationBranchId === fromId), // Bidireccional
  );

  return route ? route.estimatedTime : rules.defaultTransferTime;
};