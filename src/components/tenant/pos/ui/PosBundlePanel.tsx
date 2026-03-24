"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/src/store/useCartStore";
import { formatCurrency } from "@/src/utils/currency-format";
import { useBranchStore } from "@/src/store/useBranchStore";
import {
  BundleDomainService,
  BundleDefinition,
} from "@/src/domain/tenant/services/bundle.service";
import { PROMOTIONS_MOCK } from "@/src/mocks/mock.promotions";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { Gift } from "lucide-react";

export function PosBundlesPanel() {
  const { items, globalRentalDates, applyBundleDefinition, activeTenantId } =
    useCartStore();

  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);

  const startDate = globalRentalDates?.from ?? new Date();
  const endDate = globalRentalDates?.to ?? new Date();

  const tenantId = activeTenantId ?? items[0]?.product.tenantId;

  const { products, inventoryItems, stockLots, productVariants } = useInventoryStore();
  const bundleService = useMemo(() => new BundleDomainService(), []);

  const bundles = useMemo(() => {
    if (!tenantId) return [];
    return bundleService.createBundleDefinitionsFromPromotions(
      PROMOTIONS_MOCK,
      products,
      tenantId,
    );
  }, [tenantId, bundleService, products]);

  const evaluations = useMemo(() => {
    if (!tenantId) return [];
    return bundles.map((bundle: BundleDefinition) => {
      const eligibility = bundleService.detectBundleEligibility(
        items,
        bundle,
        tenantId,
        selectedBranchId,
        startDate,
        endDate,
        inventoryItems,
        stockLots,
        productVariants,
      );

      return { bundle, eligibility };
    });
  }, [
    items,
    bundles,
    tenantId,
    selectedBranchId,
    startDate,
    endDate,
    bundleService,
    inventoryItems,
    stockLots,
    productVariants,
  ]);

  const relevantBundles = useMemo(() => {
    return evaluations.filter(({ eligibility }) => eligibility.eligible);
  }, [evaluations]);

  if (relevantBundles.length === 0) return null;

  const handleApplyBundle = (bundleId: string) => {
    const target = bundles.find((b) => b.id === bundleId);
    if (!target) return;

    applyBundleDefinition(target, selectedBranchId, startDate, endDate);
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
                  Precio final {formatCurrency(bundle.discountValue)}
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
