"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/badge";
import { useCartStore } from "@/src/store/useCartStore";
import { USER_MOCK } from "@/src/mocks/mock.user";
import {
  createBundleDefinitionsFromPromotions,
  detectBundleEligibility,
} from "@/src/services/bundleService";
import { Gift } from "lucide-react";

export function PosBundlesPanel() {
  const { items, globalRentalDates, applyBundleDefinition } = useCartStore();

  const currentBranchId = USER_MOCK[0].branchId;

  const startDate = globalRentalDates?.from ?? new Date();
  const endDate = globalRentalDates?.to ?? new Date();

  const bundles = useMemo(() => createBundleDefinitionsFromPromotions(), []);

  const evaluations = useMemo(() => {
    return bundles.map((bundle) => {
      const eligibility = detectBundleEligibility(
        items,
        bundle,
        currentBranchId,
        startDate,
        endDate,
      );

      return { bundle, eligibility };
    });
  }, [items, bundles, currentBranchId, startDate, endDate]);

  const relevantBundles = useMemo(() => {
    return evaluations.filter(({ eligibility }) => eligibility.eligible);
  }, [evaluations]);

  if (relevantBundles.length === 0) return null;

  const handleApplyBundle = (bundleId: string) => {
    const target = bundles.find((b) => b.id === bundleId);
    if (!target) return;

    applyBundleDefinition(target, currentBranchId, startDate, endDate);
  };

  if (!relevantBundles.length) return null;
  return (
    <div className="flex flex-col w-full gap-2">
      {relevantBundles.map(({ bundle, eligibility }) => (
        <div
          key={bundle.id}
          className="flex justify-between items-center border rounded-md px-2 py-2"
        >
          <div className="flex flex-col">
            <span className="flex items-center gap-2 text-sm font-medium">
              <Gift className="w-4 h-4" /> {bundle.name}
            </span>

            <div className="flex items-center gap-2 mt-1">
              {bundle.discountType === "percentage" ? (
                <>
                  <span className="text-xs text-muted-foreground">
                    Descuento
                  </span>
                  <span className="text-sm font-bold text-emerald-600">
                    {bundle.discountValue}%
                  </span>
                </>
              ) : (
                <span className="text-sm font-bold text-emerald-600">
                  Precio final {bundle.discountValue}
                </span>
              )}

              {eligibility.possibleCount > 1 && (
                <span className="text-[10px] text-muted-foreground">
                  ({eligibility.possibleCount} posibles)
                </span>
              )}
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => handleApplyBundle(bundle.id)}
          >
            Aplicar
          </Button>
        </div>
      ))}
    </div>
  );
}
