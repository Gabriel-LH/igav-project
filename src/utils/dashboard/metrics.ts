import { Operation } from "@/src/types/operation/type.operations";
import { RentalItem } from "@/src/types/rentals/type.rentalsItem";
import { SaleItem } from "@/src/types/sales/type.saleItem";
import { Sale } from "@/src/types/sales/type.sale";
import { Product } from "@/src/types/product/type.product";
import { Reservation } from "@/src/types/reservation/type.reservation";
import { parseLocalDate } from "./date-utils";
import {
  getCountableReservationOperationIds,
  isCountableOperation,
} from "../reservation/metrics-filters";

export type CustomerData = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: unknown;
};

/**
 * Calculates metrics for the SectionCards (Total Incomes, New Customers, Active Accounts)
 */
export function getSectionCardMetrics(
  operations: Operation[],
  customers: CustomerData[],
  reservations: Reservation[] = [],
) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const countableReservationOperationIds =
    getCountableReservationOperationIds(reservations);

  // Income calculations
  const totalIncome = operations
    .filter((op) => isCountableOperation(op, countableReservationOperationIds))
    .reduce((sum, op) => sum + op.totalAmount, 0);

  const incomeThisMonth = operations
    .filter(
      (op) =>
        isCountableOperation(op, countableReservationOperationIds) &&
        parseLocalDate(op.date) >= thirtyDaysAgo,
    )
    .reduce((sum, op) => sum + op.totalAmount, 0);

  const incomeLastMonth = operations
    .filter(
      (op) =>
        isCountableOperation(op, countableReservationOperationIds) &&
        parseLocalDate(op.date) >= sixtyDaysAgo &&
        parseLocalDate(op.date) < thirtyDaysAgo,
    )
    .reduce((sum, op) => sum + op.totalAmount, 0);

  const incomeGrowthRate =
    incomeLastMonth === 0
      ? incomeThisMonth > 0
        ? 100
        : 0
      : ((incomeThisMonth - incomeLastMonth) / incomeLastMonth) * 100;

  // New customers calculations
  const newCustomersThisMonth = customers.filter(
    (c) => parseLocalDate(c.createdAt) >= thirtyDaysAgo,
  ).length;

  const newCustomersLastMonth = customers.filter(
    (c) =>
      parseLocalDate(c.createdAt) >= sixtyDaysAgo &&
      parseLocalDate(c.createdAt) < thirtyDaysAgo,
  ).length;

  const customersGrowthRate =
    newCustomersLastMonth === 0
      ? newCustomersThisMonth > 0
        ? 100
        : 0
      : ((newCustomersThisMonth - newCustomersLastMonth) / newCustomersLastMonth) *
        100;

  // Active accounts health
  const activeAccountsCount = customers.filter(
    (c) => c.status === "Activo" || c.status === "active",
  ).length;

  const totalPossible = Math.max(1, customers.length);
  const activePercentage = (activeAccountsCount / totalPossible) * 100;

  return {
    totalIncome,
    incomeGrowthRate: incomeGrowthRate.toFixed(1),
    newCustomersCount: newCustomersThisMonth,
    customersGrowthRate: customersGrowthRate.toFixed(1),
    activeAccountsCount,
    activeGrowthRate: activePercentage.toFixed(1), // Show health % instead of growth for "Active Accounts"
    growthRate: `${incomeGrowthRate >= 0 ? "+" : ""}${incomeGrowthRate.toFixed(1)}%`,
  };
}

/**
 * Prepares the area chart data grouped by day, separating ventas and alquileres.
 */
export function getChartAreaMetrics(
  operations: Operation[],
  reservations: Reservation[] = [],
) {
  const chartDataMap = new Map<
    string,
    { date: string; alquiler: number; venta: number }
  >();
  const countableReservationOperationIds =
    getCountableReservationOperationIds(reservations);

  const now = new Date();
  
  // Fill last 90 days with 0s to ensure a baseline (supporting 3-month view)
  for (let i = 89; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    
    // Consistent YYYY-MM-DD manual format for map keys
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;
    
    chartDataMap.set(dateStr, { date: dateStr, alquiler: 0, venta: 0 });
  }

  operations.forEach((op) => {
    if (!isCountableOperation(op, countableReservationOperationIds)) return;

    // Use parseLocalDate to get correct YYYY-MM-DD from operation date
    const opDate = parseLocalDate(op.date);
    
    // Manual YYYY-MM-DD to avoid ISO shift (always matching baseline format)
    const year = opDate.getFullYear();
    const month = String(opDate.getMonth() + 1).padStart(2, "0");
    const day = String(opDate.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    // Only update if it's within our map
    const current = chartDataMap.get(dateStr);
    if (!current) return; // Skip far-dated entries

    if (op.type === "alquiler") {
      current.alquiler += op.totalAmount; // Sum income (monetary value)
    } else if (op.type === "venta") {
      current.venta += op.totalAmount; // Sum income (monetary value)
    }

    chartDataMap.set(dateStr, current);
  });

  return Array.from(chartDataMap.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
}

/**
 * Groups operations by customer to populate the TopClientTable
 */
export function getTopClientsMetrics(
  operations: Operation[],
  customers: CustomerData[],
  sales: Sale[] = [],
) {
  const clientMap = new Map<
    string,
    {
      id: string;
      name: string;
      operationsRent: number;
      operationsBuy: number;
      totalRent: number;
      totalBuy: number;
      lastOperation: string;
      status: string;
    }
  >();

  // Initialize from customers
  customers.forEach((c) => {
    clientMap.set(c.id, {
      id: c.id,
      name: `${c.firstName} ${c.lastName}`.trim(),
      operationsRent: 0,
      operationsBuy: 0,
      totalRent: 0,
      totalBuy: 0,
      lastOperation: "N/A",
      status:
        c.status === "Activo" || c.status === "active" ? "Activo" : "Inactivo",
    });
  });

  operations.forEach((op) => {
    if (op.status === "cancelado") return;

    const clientStats = clientMap.get(op.customerId);
    if (!clientStats) return;

    if (op.type === "alquiler") {
      clientStats.operationsRent += 1;
      clientStats.totalRent += op.totalAmount;
    } else if (op.type === "venta") {
      clientStats.operationsBuy += 1;
      clientStats.totalBuy += op.totalAmount;
    }

    const opDate = parseLocalDate(op.date);
    const lastOpDate =
      clientStats.lastOperation !== "N/A"
        ? parseLocalDate(clientStats.lastOperation)
        : new Date(0);
        
    if (opDate > lastOpDate) {
      clientStats.lastOperation = opDate.toLocaleDateString("en-US");
    }
  });

  // Map to the format expected by the UI schema (type.ts)
  return Array.from(clientMap.values())
    .filter(
      (c) =>
        (c.operationsRent > 0 || c.operationsBuy > 0) && c.status === "Activo",
    )
    .map((c, index) => ({
      ...c,
      id: index + 1, // Schema expects number
      totalRent: `S/. ${c.totalRent.toLocaleString()}`, // Correct currency symbol logic
      totalBuy: `S/. ${c.totalBuy.toLocaleString()}`, 
      type: "Cliente", // Required by schema
    }));
}

/**
 * Calculates frequency of rented/sold items for TopMostPopularTable
 */
export function getMostPopularMetrics(
  operations: Operation[],
  rentalItems: RentalItem[] = [],
  saleItems: SaleItem[] = [],
  products: Product[] = [],
  sales: Sale[] = [],
) {
  const frequencyMap = new Map<
    string,
    {
      id: string;
      name: string;
      type: string;
      rentals: number;
      sales: number;
      price: number;
    }
  >();

  const ingestItems = (
    items: (RentalItem | SaleItem)[],
    type: "Alquiler" | "Venta",
  ) => {
    items.forEach((item) => {
      const opId = (item as any).operationId || (item as any).rentalId;
      let op = operations.find((o) => String(o.id) === String(opId));

      // Fallback for sales: seek operation through the Sale object
      if (!op && type === "Venta") {
        const sale = sales.find((s) => s.id === (item as any).saleId);
        if (sale) {
          op = operations.find((o) => String(o.id) === String(sale.operationId));
        }
      }

      if (!op || op.status === "cancelado") return;

      const prod = products.find((p) => p.id === item.productId);
      if (!prod) return;

      const key = `${prod.id}:${type}`;

      const current = frequencyMap.get(key) || {
        id: prod.id,
        name: prod.name,
        type: type,
        rentals: 0,
        sales: 0,
        price: (item as any).priceAtMoment || 0,
      };

      const quantity = (item as any).quantity || 1;
      if (type === "Alquiler") current.rentals += quantity;
      else current.sales += quantity;

      frequencyMap.set(key, current);
    });
  };

  ingestItems(rentalItems, "Alquiler");
  ingestItems(saleItems, "Venta");

  return Array.from(frequencyMap.values())
    .map((item) => ({
      id: `${item.id}-${item.type}`,
      name: item.name,
      type: item.type,
      count: item.rentals + item.sales,
      income: (item.rentals + item.sales) * item.price,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

/**
 * Calculates trading fast metrics for TradingFastTable
 */
export function getTradingFastMetrics(
  operations: Operation[],
  rentalItems: RentalItem[] = [],
  saleItems: SaleItem[] = [],
  products: Product[] = [],
  sales: Sale[] = [],
) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const statsMap = new Map<
    string,
    {
      id: string;
      name: string;
      lastweek: number;
      thisweek: number;
      lastDate: Date;
    }
  >();

  const ingestRecent = (items: (RentalItem | SaleItem)[]) => {
    items.forEach((item) => {
      const opId = (item as any).operationId || (item as any).rentalId;
      let op = operations.find((o) => String(o.id) === String(opId));

      // Fallback for sales
      if (!op && (item as any).saleId) {
        const sale = sales.find((s) => s.id === (item as any).saleId);
        if (sale) {
          op = operations.find((o) => String(o.id) === String(sale.operationId));
        }
      }

      if (!op || op.status === "cancelado") return;

      const opDate = parseLocalDate(op.date);
      if (opDate < fourteenDaysAgo) return;

      const prod = products.find((p) => p.id === item.productId);
      if (!prod) return;

      const current = statsMap.get(prod.id) || {
        id: prod.id,
        name: prod.name,
        lastweek: 0,
        thisweek: 0,
        lastDate: new Date(0),
      };

      const quantity = (item as any).quantity || 1;

      if (opDate >= sevenDaysAgo) {
        current.thisweek += quantity;
      } else if (opDate >= fourteenDaysAgo) {
        current.lastweek += quantity;
      }

      if (opDate > current.lastDate) {
        current.lastDate = opDate;
      }

      statsMap.set(prod.id, current);
    });
  };

  ingestRecent(rentalItems);
  ingestRecent(saleItems);

  return Array.from(statsMap.values())
    .map((item) => ({
      id: item.id,
      item: item.name,
      lastweek: item.lastweek,
      thisweek: item.thisweek,
      difference: item.thisweek - item.lastweek,
      lastDate: item.lastDate,
    }))
    .sort((a, b) => {
      // 1. Primary sort: Difference DESC (Growth)
      if (b.difference !== a.difference) {
        return b.difference - a.difference;
      }
      // 2. Secondary sort: lastDate DESC (Recency)
      if (b.lastDate.getTime() !== a.lastDate.getTime()) {
        return b.lastDate.getTime() - a.lastDate.getTime();
      }
      // 3. Tertiary sort: current volume DESC
      return b.thisweek - a.thisweek;
    })
    .slice(0, 10);
}
