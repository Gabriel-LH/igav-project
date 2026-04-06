import { Operation } from "@/src/types/operation/type.operations";
import { RentalItem } from "@/src/types/rentals/type.rentalsItem";
import { SaleItem } from "@/src/types/sales/type.saleItem";
import { ReservationItem } from "@/src/types/reservation/type.reservationItem";
import { Sale } from "@/src/types/sales/type.sale";
import { Product } from "@/src/types/product/type.product";
import { Category } from "@/src/types/category/type.category";
import { Rental } from "@/src/types/rentals/type.rentals";
import { parseLocalDate } from "../dashboard/date-utils";
import { formatCurrency } from "../currency-format";
import { eachDayOfInterval, format as formatDate, subDays, startOfDay, endOfDay } from "date-fns";
import { calculateTaxTotals } from "../pricing/tax-calculation";
import type { TenantConfig } from "@/src/types/tenant/type.tenantConfig";

type SimpleDateRange = { from?: Date; to?: Date } | undefined;

function getOperationTaxConfig(
  operation: Operation,
): TenantConfig["tax"] | null {
  const snapshot = operation.configSnapshot as
    | { tenant?: { tax?: TenantConfig["tax"] }; tax?: TenantConfig["tax"] }
    | undefined;

  return snapshot?.tenant?.tax ?? snapshot?.tax ?? null;
}

export function getAnalyticsOverviewMetrics(
  operations: Operation[],
  products: Product[] = [],
  rentals: Rental[] = [],
  rentalItems: RentalItem[] = [],
  saleItems: SaleItem[] = [],
  reservationItems: ReservationItem[] = [],
  hasSalesFeature: boolean = false,
) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const activeOps = operations.filter((op) => op.status !== "cancelado");

  // Keep "ingresos" aligned with dashboard: use operation totals, not raw item sums.
  const totalIncome = activeOps.reduce((sum, op) => sum + op.totalAmount, 0);

  const opCurrent = activeOps
    .filter((op) => parseLocalDate(op.date) >= thirtyDaysAgo)
    .reduce((sum, op) => sum + op.totalAmount, 0);
  const prevTotal = activeOps
    .filter((op) => {
      const d = parseLocalDate(op.date);
      return d >= sixtyDaysAgo && d < thirtyDaysAgo;
    })
    .reduce((sum, op) => sum + op.totalAmount, 0);

  const incomeTrend = prevTotal > 0 ? ((opCurrent - prevTotal) / prevTotal) * 100 : 0;

  const totalRentedItems = rentalItems.reduce((sum, ri) => sum + (ri.quantity || 1), 0) +
                           reservationItems.reduce((sum, ri) => sum + (ri.quantity || 1), 0);
  const uniqueProductsCount = Math.max(products.length, 1);
  const avgRotation = (totalRentedItems / uniqueProductsCount).toFixed(2) + "x";

  const returnedRentals = rentals.filter(
    (r) => r.status === "devuelto" && r.outDate && r.actualReturnDate,
  );
  let avgDurationStr = "N/A";
  if (returnedRentals.length > 0) {
    const totalDays = returnedRentals.reduce((sum, r) => {
      const out = new Date(r.outDate).getTime();
      const ret = new Date(r.actualReturnDate!).getTime();
      return sum + (ret - out) / (1000 * 60 * 60 * 24);
    }, 0);
    avgDurationStr = (totalDays / returnedRentals.length).toFixed(1) + " días";
  }

  const results = [
    {
      title: "Ingresos totales",
      value: formatCurrency(totalIncome),
      trend: incomeTrend,
      trendLabel: "vs mes anterior",
    },
  ];

  const rentalIncome = activeOps
    .filter((op) => op.type === "alquiler")
    .reduce((sum, op) => sum + op.totalAmount, 0);
  const saleIncome = activeOps
    .filter((op) => op.type === "venta")
    .reduce((sum, op) => sum + op.totalAmount, 0);
  const reservationIncome = activeOps
    .filter((op) => op.type === "reserva")
    .reduce((sum, op) => sum + op.totalAmount, 0);

  if (rentalIncome > 0) results.push({ title: "Ingresos por alquiler", value: formatCurrency(rentalIncome) });
  if (saleIncome > 0 && hasSalesFeature) results.push({ title: "Ingresos por ventas", value: formatCurrency(saleIncome) });
  if (reservationIncome > 0) results.push({ title: "Ingresos por reservas", value: formatCurrency(reservationIncome) });

  results.push(
    { title: "Rotación promedio", value: avgRotation },
    { title: "Duración real promedio", value: avgDurationStr },
  );

  return results;
}

interface ChartPoint {
  date: string;
  rentals: number;
  sales: number;
  sortKey: number;
}

export function getRentalsLineChartMetrics(
  operations: Operation[],
  rentalItems: RentalItem[] = [],
  saleItems: SaleItem[] = [],
  reservationItems: ReservationItem[] = [],
  sales: Sale[] = [],
  dateRange?: SimpleDateRange,
): ChartPoint[] {
  const dataMap = new Map<string, ChartPoint>();

  const end = dateRange?.to ? endOfDay(dateRange.to) : endOfDay(new Date());
  let start = dateRange?.from ? startOfDay(dateRange.from) : startOfDay(subDays(end, 29));

  if (Math.abs((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) > 31) {
    start = startOfDay(subDays(end, 30));
  }

  const days = eachDayOfInterval({ start, end });
  days.forEach((day) => {
    const dateStr = formatDate(day, "yyyy-MM-dd");
    dataMap.set(dateStr, { date: dateStr, rentals: 0, sales: 0, sortKey: day.getTime() });
  });

  const ingestItems = (items: (RentalItem | SaleItem | ReservationItem)[], type: "rent" | "sale") => {
    items.forEach((item) => {
      let opId: string | undefined;
      // RentalItem and ReservationItem often have operationId directly
      if ("saleId" in item) {
        const sale = sales.find(s => String(s.id) === String(item.saleId));
        opId = sale?.operationId;
      } else {
        opId = (item as any).operationId || (item as any).rentalId || (item as any).reservationId;
      }

      if (!opId) return;
      const op = operations.find(o => String(o.id) === String(opId));
      if (!op || op.status === "cancelado") return;

      const dt = parseLocalDate(op.date);
      const ds = formatDate(dt, "yyyy-MM-dd");
      const curr = dataMap.get(ds);
      if (curr) {
        if (type === "rent") curr.rentals += (item.priceAtMoment || 0) * (item.quantity || 1);
        else curr.sales += (item.priceAtMoment || 0) * (item.quantity || 1);
      }
    });
  };

  ingestItems(rentalItems, "rent");
  ingestItems(reservationItems, "rent");
  ingestItems(saleItems, "sale");

  return Array.from(dataMap.values()).sort((a, b) => a.sortKey - b.sortKey);
}

interface DiscountPoint {
  date: string;
  conDescuento: number;
  sinDescuento: number;
  sortKey: number;
}

export function getDiscountImpactMetrics(
  operations: Operation[],
  rentalItems: RentalItem[] = [],
  saleItems: SaleItem[] = [],
  reservationItems: ReservationItem[] = [],
  sales: Sale[] = [],
  dateRange?: SimpleDateRange,
): DiscountPoint[] {
  const dataMap = new Map<string, DiscountPoint>();

  const end = dateRange?.to ? endOfDay(dateRange.to) : endOfDay(new Date());
  let start = dateRange?.from ? startOfDay(dateRange.from) : startOfDay(subDays(end, 29));

  if (Math.abs((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) > 31) {
    start = startOfDay(subDays(end, 30));
  }

  const days = eachDayOfInterval({ start, end });
  days.forEach((day) => {
    const dateStr = formatDate(day, "yyyy-MM-dd");
    dataMap.set(dateStr, { date: dateStr, conDescuento: 0, sinDescuento: 0, sortKey: day.getTime() });
  });

  const grossBaseByOperationId = new Map<string, number>();

  const addGrossBase = (operationId: string | undefined, amount: number) => {
    if (!operationId || amount <= 0) return;
    grossBaseByOperationId.set(
      operationId,
      (grossBaseByOperationId.get(operationId) ?? 0) + amount,
    );
  };

  rentalItems.forEach((item) => {
    const grossUnitPrice = item.listPrice ?? item.priceAtMoment ?? 0;
    addGrossBase(
      String(item.operationId || item.rentalId),
      grossUnitPrice * (item.quantity || 1),
    );
  });

  reservationItems.forEach((item) => {
    const grossUnitPrice = item.listPrice ?? item.priceAtMoment ?? 0;
    addGrossBase(
      String(item.operationId || item.reservationId),
      grossUnitPrice * (item.quantity || 1),
    );
  });

  saleItems.forEach((item) => {
    const sale = sales.find(
      (currentSale) => String(currentSale.id) === String(item.saleId),
    );
    const grossUnitPrice = item.listPrice ?? item.priceAtMoment ?? 0;
    addGrossBase(
      sale?.operationId ? String(sale.operationId) : undefined,
      grossUnitPrice * (item.quantity || 1),
    );
  });

  operations.forEach((operation) => {
    if (operation.status === "cancelado") return;

    const dt = parseLocalDate(operation.date);
    const ds = formatDate(dt, "yyyy-MM-dd");
    const current = dataMap.get(ds);
    if (!current) return;

    const totalWithDiscount = operation.totalAmount || 0;
    const taxConfig = getOperationTaxConfig(operation);
    const grossBaseFromItems = grossBaseByOperationId.get(String(operation.id)) ?? 0;
    const grossFromItemsWithTax =
      grossBaseFromItems > 0
        ? taxConfig
          ? calculateTaxTotals(grossBaseFromItems, taxConfig).total
          : operation.taxRate && operation.taxRate > 0
            ? grossBaseFromItems * (1 + operation.taxRate)
            : grossBaseFromItems
        : 0;
    const grossFromOperationDiscount = totalWithDiscount + (operation.discountAmount || 0);
    const grossWithoutDiscount = Math.max(
      grossFromItemsWithTax,
      grossFromOperationDiscount,
      totalWithDiscount,
    );

    current.conDescuento += totalWithDiscount;
    current.sinDescuento += grossWithoutDiscount;
  });

  return Array.from(dataMap.values()).sort((a, b) => a.sortKey - b.sortKey);
}

export function getPriceVsRotationMetrics(
  operations: Operation[],
  rentalItems: RentalItem[],
  saleItems: SaleItem[],
  reservationItems: ReservationItem[] = [],
  sales: Sale[] = [],
  products: Product[],
  hasSalesFeature: boolean,
) {
  const freqMap = new Map<string, { product: Product; rentals: number; sales: number; price: number }>();

  const ingestItems = (itemList: any[], type: "rent" | "sale") => {
    itemList.forEach((item) => {
      let opId: string | undefined;
      if (type === "sale") {
        const sale = sales.find((s) => s.id === item.saleId);
        opId = sale?.operationId;
      } else {
        opId = item.operationId || item.rentalId || item.reservationId;
      }

      if (!opId) return;
      const op = operations.find((o) => String(o.id) === String(opId));
      if (!op || op.status === "cancelado") return;

      const p = products.find((prod) => prod.id === item.productId);
      if (!p) return;

      const current = freqMap.get(p.id) || { product: p, rentals: 0, sales: 0, price: 0 };
      if (type === "rent") current.rentals += item.quantity || 1;
      else current.sales += item.quantity || 1;
      current.price = item.priceAtMoment || item.listPrice || 0;
      freqMap.set(p.id, current);
    });
  };

  ingestItems(rentalItems, "rent");
  ingestItems(reservationItems, "rent");
  if (hasSalesFeature) ingestItems(saleItems, "sale");

  const results: any[] = [];
  freqMap.forEach((v) => {
    if (v.rentals > 0) results.push({ name: v.product.name, price: v.price, rotation: v.rentals, type: "rental" });
    if (v.sales > 0 && hasSalesFeature) results.push({ name: v.product.name, price: v.price, rotation: v.sales, type: "sale" });
  });

  return results.slice(0, 50);
}

export function getActivityHeatmapMetrics(
  operations: Operation[],
  rentalItems: RentalItem[],
  saleItems: SaleItem[],
  reservationItems: ReservationItem[] = [],
  sales: Sale[] = [],
  products: Product[],
  categories: Category[],
  isFiltered: boolean = false,
) {
  const heatmapRows: any[] = [];

  operations.forEach((op) => {
    if (op.status === "cancelado") return;
    let pertinentItems: any[] = [];

    if (op.type === "venta") {
      const sale = sales.find((s) => String(s.operationId) === String(op.id));
      if (sale) pertinentItems = saleItems.filter((s) => s.saleId === sale.id);
    } else if (op.type === "alquiler") {
      pertinentItems = rentalItems.filter((r) => String(r.operationId || r.rentalId) === String(op.id));
    } else if (op.type === "reserva") {
      pertinentItems = reservationItems.filter((ri) => String(ri.operationId || ri.reservationId) === String(op.id));
    }

    pertinentItems.forEach((item) => {
      const p = products.find((prod) => prod.id === item.productId);
      const cat = p ? categories.find((c) => c.id === p.categoryId) : undefined;
      const categoryName = cat ? cat.name : "Otros";
      const localDate = parseLocalDate(op.date);
      const dateKey = formatDate(localDate, "dd/MM");

      heatmapRows.push({
        name: p ? p.name : "Op " + op.referenceCode,
        category: categoryName,
        date: dateKey,
        rentals: op.type === "alquiler" ? item.quantity || 1 : 0,
        sales: op.type === "venta" ? item.quantity || 1 : 0,
        reservas: op.type === "reserva" ? item.quantity || 1 : 0,
      });
    });

    if (pertinentItems.length === 0 && !isFiltered) {
      const dateKey = formatDate(parseLocalDate(op.date), "dd/MM");
      heatmapRows.push({
        name: "Op " + (op.referenceCode?.replace("OP-", "") || op.id.slice(0, 8)),
        category: "Generales",
        date: dateKey,
        rentals: op.type === "alquiler" ? 1 : 0,
        sales: op.type === "venta" ? 1 : 0,
        reservas: op.type === "reserva" ? 1 : 0,
      });
    }
  });

  return heatmapRows;
}

export function getGarmentsPerformanceMetrics(
  operations: Operation[],
  rentalItems: RentalItem[],
  saleItems: SaleItem[],
  reservationItems: ReservationItem[] = [],
  sales: Sale[] = [],
  rentals: Rental[] = [],
  products: Product[],
  hasSalesFeature: boolean,
) {
  const perfMap = new Map<string, { p: Product; rentals: number; sales: number; revenue: number; costBasis: number; usageDays: number }>();

  const ingestPerf = (items: any[], opType: "alquiler" | "venta" | "reserva") => {
    items.forEach((item) => {
      let opId: string | undefined;
      let rentalObj: Rental | undefined;
      if (opType === "venta") {
        opId = sales.find((s) => s.id === item.saleId)?.operationId;
      } else {
        opId = item.operationId || item.rentalId || item.reservationId;
        if (opType === "alquiler") {
          rentalObj = rentals.find(r => r.id === item.rentalId || r.operationId === item.operationId);
        }
      }
      if (!opId) return;
      const op = operations.find((o) => String(o.id) === String(opId));
      if (!op || op.status === "cancelado") return;

      const p = products.find((prod) => prod.id === item.productId);
      if (!p) return;
      const price = item.priceAtMoment ?? 0;
      const originalPrice = item.listPrice || (price + (item.discountAmount || 0));

      const current = perfMap.get(p.id) || { p, rentals: 0, sales: 0, revenue: 0, costBasis: originalPrice, usageDays: 0 };
      if (opType !== "venta") {
        current.rentals += item.quantity || 1;
        if (rentalObj?.outDate && rentalObj?.actualReturnDate) {
          const out = new Date(rentalObj.outDate).getTime();
          const ret = new Date(rentalObj.actualReturnDate).getTime();
          current.usageDays += Math.max(1, Math.ceil((ret - out) / (1000 * 60 * 60 * 24)));
        } else current.usageDays += 2; // Est. for reserva / items not returned yet
      } else current.sales += item.quantity || 1;
      current.revenue += price * (item.quantity || 1);
      perfMap.set(p.id, current);
    });
  };

  ingestPerf(rentalItems, "alquiler");
  ingestPerf(reservationItems, "reserva");
  if (hasSalesFeature) ingestPerf(saleItems, "venta");

  const finalRows: any[] = [];
  perfMap.forEach((v) => {
    const totalTransactions = v.rentals + v.sales;
    let s = "en_revision";
    if (totalTransactions > 4 && v.revenue > 1000) s = "potenciar";
    else if (totalTransactions >= 1) s = "sostenible";
    finalRows.push({ name: v.p.name, rentals: v.rentals, sales: v.sales, usageDays: Math.round(v.usageDays), revenue: v.revenue, roi: Math.round((v.revenue / (v.costBasis || 1)) * 100), status: s });
  });

  return finalRows.sort((a, b) => b.revenue - a.revenue).slice(0, 10);
}

export function getAnalyticsInsights(
  operations: Operation[],
  rentalItems: RentalItem[] = [],
  saleItems: SaleItem[] = [],
  reservationItems: ReservationItem[] = [],
  sales: Sale[] = [],
  hasSalesFeature: boolean = false,
) {
  const activeOps = operations.filter((o) => o.status !== "cancelado");
  const filteredOpIds = new Set([
    ...rentalItems.map(ri => String(ri.operationId || ri.rentalId)),
    ...reservationItems.map(ri => String(ri.operationId || ri.reservationId)),
    ...saleItems.map(si => {
      const sale = sales.find(s => String(s.id) === String(si.saleId));
      return sale ? String(sale.operationId) : String(si.saleId);
    })
  ]);
  
  const totalOps = filteredOpIds.size || 0;
  const totalIncome = rentalItems.reduce((sum, item) => sum + (item.priceAtMoment || 0) * (item.quantity || 1), 0) +
                      saleItems.reduce((sum, item) => sum + (item.priceAtMoment || 0) * (item.quantity || 1), 0) +
                      reservationItems.reduce((sum, item) => sum + (item.priceAtMoment || 0) * (item.quantity || 1), 0);

  const completedCount = activeOps.filter(o => filteredOpIds.has(String(o.id)) && o.status === "completado").length;
  const insights = [];

  if (totalOps > 0) {
    const completionRate = Math.round((completedCount / totalOps) * 100);
    insights.push(`Tasa de cumplimiento: ${completionRate}% de ${totalOps} operaciones filtradas.`);
    insights.push(`Ticket promedio: ${formatCurrency(totalIncome / totalOps)}.`);
  } else {
    insights.push("Aún no hay operaciones suficientes para este filtrado.");
  }
  return insights;
}
