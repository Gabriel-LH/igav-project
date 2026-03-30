"use client";

import { useMemo } from "react";
import { useOperationStore } from "@/src/store/useOperationStore";
import { useRentalStore } from "@/src/store/useRentalStore";
import { useSaleStore } from "@/src/store/useSaleStore";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { usePlanFeatures } from "./usePlanFeatures";
import { useCategoryStore } from "@/src/store/useCategoryStore";
import {
  getAnalyticsOverviewMetrics,
  getRentalsLineChartMetrics,
  getDiscountImpactMetrics,
  getPriceVsRotationMetrics,
  getActivityHeatmapMetrics,
  getGarmentsPerformanceMetrics,
  getAnalyticsInsights,
} from "@/src/utils/analytics/metrics";

export function useAnalyticsData() {
  const operations = useOperationStore((s) => s.operations);
  const rentalItems = useRentalStore((s) => s.rentalItems);
  const saleItems = useSaleStore((s) => s.saleItems);
  const products = useInventoryStore((s) => s.products);
  const categories = useCategoryStore((s) => s.categories);
  const { hasFeature } = usePlanFeatures();

  const hasSalesFeature = hasFeature("sales");

  // Filtrar operaciones de ventas si el plan no las permite
  const filteredOperations = useMemo(() => {
    if (hasSalesFeature) return operations;
    return operations.filter((op) => op.type !== "venta");
  }, [operations, hasSalesFeature]);

  const overviewData = useMemo(
    () => getAnalyticsOverviewMetrics(filteredOperations),
    [filteredOperations],
  );

  const lineChartData = useMemo(
    () => getRentalsLineChartMetrics(filteredOperations),
    [filteredOperations],
  );

  const discountData = useMemo(
    () => getDiscountImpactMetrics(filteredOperations),
    [filteredOperations],
  );

  const priceRotationData = useMemo(
    () =>
      getPriceVsRotationMetrics(
        filteredOperations,
        rentalItems,
        saleItems,
        products,
        hasSalesFeature,
      ),
    [filteredOperations, rentalItems, saleItems, products, hasSalesFeature],
  );

  const heatmapData = useMemo(
    () =>
      getActivityHeatmapMetrics(
        filteredOperations,
        rentalItems,
        saleItems,
        products,
        categories,
      ),
    [filteredOperations, rentalItems, saleItems, products, categories],
  );

  const performanceData = useMemo(
    () =>
      getGarmentsPerformanceMetrics(
        filteredOperations,
        rentalItems,
        saleItems,
        products,
        hasSalesFeature,
      ),
    [filteredOperations, rentalItems, saleItems, products, hasSalesFeature],
  );

  const insightsData = useMemo(
    () => getAnalyticsInsights(filteredOperations, hasSalesFeature),
    [filteredOperations, hasSalesFeature],
  );

  return {
    overviewData,
    lineChartData,
    discountData,
    priceRotationData,
    heatmapData,
    performanceData,
    insightsData,
    hasSalesFeature,
  };
}
