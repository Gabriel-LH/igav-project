"use client";

import { useMemo } from "react";
import { useOperationStore } from "@/src/store/useOperationStore";
import { useRentalStore } from "@/src/store/useRentalStore";
import { useSaleStore } from "@/src/store/useSaleStore";
import { useReservationStore } from "@/src/store/useReservationStore"; // Added
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { usePlanFeatures } from "./usePlanFeatures";
import { useCategoryStore } from "@/src/store/useCategoryStore";
import {
  filterCountableReservationItems,
  getCountableReservationOperationIds,
  isCountableOperation,
} from "@/src/utils/reservation/metrics-filters";
import {
  getAnalyticsOverviewMetrics,
  getRentalsLineChartMetrics,
  getDiscountImpactMetrics,
  getPriceVsRotationMetrics,
  getActivityHeatmapMetrics,
  getGarmentsPerformanceMetrics,
} from "@/src/utils/analytics/metrics";
import { buildAnalyticsInsights } from "@/src/utils/analytics/insights";

import { useAnalyticsStore } from "@/src/store/useAnalyticsStore";
import { parseLocalDate } from "../utils/dashboard/date-utils";
import { isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { getDescendants } from "../utils/category/categoryTree";
import type { RentalItem } from "@/src/types/rentals/type.rentalsItem";
import type { SaleItem } from "@/src/types/sales/type.saleItem";
import type { ReservationItem } from "@/src/types/reservation/type.reservationItem";

type FilterableItem =
  | RentalItem
  | SaleItem
  | (ReservationItem & { operationId?: string });

export function useAnalyticsData() {
  const operations = useOperationStore((s) => s.operations);
  const rentalItems = useRentalStore((s) => s.rentalItems);
  const saleItems = useSaleStore((s) => s.saleItems);
  const reservationItems = useReservationStore((s) => s.reservationItems); // Added
  const reservations = useReservationStore((s) => s.reservations);
  const sales = useSaleStore((s) => s.sales);
  const rentals = useRentalStore((s) => s.rentals);
  const products = useInventoryStore((s) => s.products);
  const categories = useCategoryStore((s) => s.categories);
  const { hasFeature } = usePlanFeatures();
  
  const appliedFilters = useAnalyticsStore((s) => s.appliedFilters);
  const { dateRange, categoryId, productId } = appliedFilters;
  const hasSalesFeature = hasFeature("sales");

  // 1. APLICAR FILTROS DE DATOS (CORE)
  const filteredData = useMemo(() => {
    const countableReservationOperationIds =
      getCountableReservationOperationIds(reservations);
    const reservationOperationById = new Map(
      reservations.map((reservation) => [
        reservation.id,
        reservation.operationId,
      ]),
    );

    // A) Filtrar Operaciones por Rango
    let ops = operations.filter((op) => {
      if (!isCountableOperation(op, countableReservationOperationIds)) {
        return false;
      }
      if (dateRange?.from && dateRange?.to) {
        const opDate = parseLocalDate(op.date);
        return isWithinInterval(opDate, { 
          start: startOfDay(dateRange.from), 
          end: endOfDay(dateRange.to) 
        });
      }
      return true;
    });

    // B) Filtrar Ítems por Categoría/Producto
    let rItems = [...rentalItems];
    let sItems = [...saleItems];
    let resItems = filterCountableReservationItems(
      reservationItems,
      reservations,
    ).map((item) => ({
      ...item,
      operationId:
        item.operationId ?? reservationOperationById.get(item.reservationId),
    }));

    if ((categoryId && categoryId !== "all") || productId) {
      const categoryIds = (categoryId && categoryId !== "all")
        ? [categoryId, ...getDescendants(categories, categoryId)] 
        : [];

      const filterFn = (item: FilterableItem) => {
        if (productId && item.productId !== productId) return false;
        if (categoryIds.length > 0) {
          const p = products.find(prod => prod.id === item.productId);
          if (!p || !p.categoryId || !categoryIds.includes(p.categoryId)) return false;
        }
        return true;
      };

      rItems = rItems.filter(filterFn);
      sItems = sItems.filter(filterFn);
      resItems = resItems.filter(filterFn); // Added

      // Sincronizar Operaciones: Solo dejar las que tienen ítems de ese filtro
      const validOpIds = new Set([
        ...rItems.map(ri => String(ri.operationId || ri.rentalId)),
        ...resItems.map(ri => String(ri.operationId || reservationOperationById.get(ri.reservationId) || ri.reservationId)),
        ...sales.filter(s => sItems.some(si => si.saleId === s.id)).map(s => String(s.operationId))
      ]);

      ops = ops.filter(op => validOpIds.has(String(op.id)));
    }

    return { ops, rItems, sItems, resItems };
  }, [operations, rentalItems, saleItems, reservationItems, reservations, sales, products, categories, dateRange, categoryId, productId]);

  const filteredOperations = filteredData.ops;
  const currentRentalItems = filteredData.rItems;
  const currentSaleItems = filteredData.sItems;
  const currentResItems = filteredData.resItems; // Added

  const overviewData = useMemo(
    () =>
      getAnalyticsOverviewMetrics(
        filteredOperations,
        products,
        rentals,
        currentRentalItems,
        currentSaleItems,
        currentResItems, // Added
        hasSalesFeature,
      ),
    [
      filteredOperations,
      products,
      rentals,
      currentRentalItems,
      currentSaleItems,
      currentResItems,
      hasSalesFeature,
    ],
  );

  const lineChartData = useMemo(
    () => getRentalsLineChartMetrics(filteredOperations, currentRentalItems, currentSaleItems, currentResItems, sales, dateRange),
    [filteredOperations, currentRentalItems, currentSaleItems, currentResItems, sales, dateRange],
  );

  const discountData = useMemo(
    () =>
      getDiscountImpactMetrics(
        filteredOperations,
        currentRentalItems,
        currentSaleItems,
        currentResItems, // Added
        sales,
        dateRange,
      ),
    [filteredOperations, currentRentalItems, currentSaleItems, currentResItems, sales, dateRange],
  );

  const priceRotationData = useMemo(
    () =>
      getPriceVsRotationMetrics(
        filteredOperations,
        currentRentalItems,
        currentSaleItems,
        currentResItems, // Added
        sales,
        products,
        hasSalesFeature,
      ),
    [filteredOperations, currentRentalItems, currentSaleItems, currentResItems, sales, products, hasSalesFeature],
  );

  const heatmapData = useMemo(
    () =>
      getActivityHeatmapMetrics(
        filteredOperations,
        currentRentalItems,
        currentSaleItems,
        currentResItems, // Added
        sales,
        products,
        categories,
        categoryId !== "all" || !!productId,
      ),
    [
      filteredOperations,
      currentRentalItems,
      currentSaleItems,
      currentResItems,
      sales,
      products,
      categories,
      categoryId,
      productId,
    ],
  );

  const performanceData = useMemo(
    () =>
      getGarmentsPerformanceMetrics(
        filteredOperations,
        currentRentalItems,
        currentSaleItems,
        currentResItems, // Added
        sales,
        rentals,
        products,
        hasSalesFeature,
      ),
    [
      filteredOperations,
      currentRentalItems,
      currentSaleItems,
      currentResItems,
      sales,
      rentals,
      products,
      hasSalesFeature,
    ],
  );

  const insightsData = useMemo(
    () =>
      buildAnalyticsInsights(
        filteredOperations,
        currentRentalItems,
        currentSaleItems,
        currentResItems, // Added
        sales,
        hasSalesFeature,
      ),
    [
      filteredOperations,
      currentRentalItems,
      currentSaleItems,
      currentResItems,
      sales,
      hasSalesFeature,
    ],
  );

  return {
    overviewData,
    lineChartData,
    discountData,
    priceRotationData,
    heatmapData,
    performanceData,
    insightsData,
    appliedFilters,
    hasSalesFeature,
  };
}
