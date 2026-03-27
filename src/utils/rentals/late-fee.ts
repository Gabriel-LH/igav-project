import { DEFAULT_TENANT_POLICY_SECTIONS } from "@/src/lib/tenant-defaults";
import { TenantPolicy } from "@/src/types/tenant/type.tenantPolicy";

export type LateFeeResult = {
  isLate: boolean;
  daysLate: number;
  lateFee: number;
  toleranceHours: number;
};

type CalculateLateFeeInput = {
  policySnapshot?: TenantPolicy | null;
  expectedReturnDate: Date;
  actualReturnDate: Date;
  totalAmount: number;
};

const resolvePolicy = (snapshot?: TenantPolicy | null): TenantPolicy => {
  const base: TenantPolicy = {
    id: "policy-default",
    tenantId: "",
    version: 1,
    isActive: true,
    createdAt: new Date(0),
    updatedBy: "system",
    ...(DEFAULT_TENANT_POLICY_SECTIONS as TenantPolicy),
  };

  if (!snapshot) return base;

  return {
    ...base,
    ...snapshot,
    rentals: {
      ...base.rentals,
      ...snapshot.rentals,
    },
  };
};

export const calculateLateFee = ({
  policySnapshot,
  expectedReturnDate,
  actualReturnDate,
  totalAmount,
}: CalculateLateFeeInput): LateFeeResult => {
  const policy = resolvePolicy(policySnapshot ?? undefined);
  const toleranceHours = policy.rentals?.lateToleranceHours ?? 0;
  const toleranceMs = Math.max(0, toleranceHours) * 60 * 60 * 1000;

  const diffMs = actualReturnDate.getTime() - expectedReturnDate.getTime();
  if (diffMs <= toleranceMs) {
    return {
      isLate: false,
      daysLate: 0,
      lateFee: 0,
      toleranceHours,
    };
  }

  const effectiveMs = diffMs - toleranceMs;
  const daysLate = Math.max(0, Math.ceil(effectiveMs / (1000 * 60 * 60 * 24)));

  const feeValue = Math.max(0, policy.rentals?.lateFeeValue ?? 0);
  let lateFee = 0;

  if (daysLate > 0) {
    if (policy.rentals?.lateFeeType === "percentage_per_day") {
      lateFee = totalAmount * (feeValue / 100) * daysLate;
    } else {
      lateFee = feeValue * daysLate;
    }
  }

  return {
    isLate: daysLate > 0,
    daysLate,
    lateFee: Math.round(lateFee * 100) / 100,
    toleranceHours,
  };
};
