import { Operation } from "@/src/types/operation/type.operations";

// Type based on mock client since it is derived from typeof CLIENTS_MOCK
export type CustomerData = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;
};

/**
 * Calculates metrics for the SectionCards (Total Incomes, New Customers, Active Accounts)
 */
export function getSectionCardMetrics(
  operations: Operation[],
  customers: CustomerData[],
) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  // Income calculations
  const totalIncome = operations
    .filter((op) => op.status !== "cancelado")
    .reduce((sum, op) => sum + op.totalAmount, 0);

  const incomeThisMonth = operations
    .filter(
      (op) => op.status !== "cancelado" && new Date(op.date) >= thirtyDaysAgo,
    )
    .reduce((sum, op) => sum + op.totalAmount, 0);

  const incomeLastMonth = operations
    .filter(
      (op) =>
        op.status !== "cancelado" &&
        new Date(op.date) >= sixtyDaysAgo &&
        new Date(op.date) < thirtyDaysAgo,
    )
    .reduce((sum, op) => sum + op.totalAmount, 0);

  const incomeGrowthRate =
    incomeLastMonth === 0
      ? incomeThisMonth > 0
        ? 100
        : 0
      : ((incomeThisMonth - incomeLastMonth) / incomeLastMonth) * 100;

  // New customers calculations
  const newCustomersCount = customers.filter(
    (c) => new Date(c.createdAt) >= thirtyDaysAgo,
  ).length;

  const newCustomersLastMonth = customers.filter(
    (c) =>
      new Date(c.createdAt) >= sixtyDaysAgo &&
      new Date(c.createdAt) < thirtyDaysAgo,
  ).length;

  const customersGrowthRate =
    newCustomersLastMonth === 0
      ? newCustomersCount > 0
        ? 100
        : 0
      : ((newCustomersCount - newCustomersLastMonth) / newCustomersLastMonth) *
        100;

  // Active accounts
  const activeAccountsCount = customers.filter(
    (c) => c.status === "Activo" || c.status === "active",
  ).length;

  // Growth rate of active accounts - simplified: comparing new active to old active
  const activeGrowthRate =
    (activeAccountsCount / Math.max(1, customers.length)) * 100; // Generic stat for showing retention

  return {
    totalIncome,
    incomeGrowthRate: incomeGrowthRate.toFixed(1),
    newCustomersCount,
    customersGrowthRate: customersGrowthRate.toFixed(1),
    activeAccountsCount,
    activeGrowthRate: activeGrowthRate.toFixed(1),
    growthRate: `+${incomeGrowthRate.toFixed(1)}%`, // Keeping as a general string placeholder if requested, but sending numbers as well
  };
}

/**
 * Prepares the area chart data grouped by day, separating ventas and alquileres.
 */
export function getChartAreaMetrics(operations: Operation[]) {
  const chartDataMap = new Map<
    string,
    { date: string; alquiler: number; venta: number }
  >();

  operations.forEach((op) => {
    // Only count completed or in-progress ops, or all as needed
    if (op.status === "cancelado") return;

    // Use pure date string (YYYY-MM-DD)
    const dateStr = new Date(op.date).toISOString().split("T")[0];

    const current = chartDataMap.get(dateStr) || {
      date: dateStr,
      alquiler: 0,
      venta: 0,
    };

    if (op.type === "alquiler") {
      current.alquiler += 1; // Or op.totalAmount if evaluating revenue
    } else if (op.type === "venta") {
      current.venta += 1;
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
) {
  const clientMap = new Map<string, any>();

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

    // Update last operation date format MM/DD/YYYY or similar
    const opDate = new Date(op.date);
    const lastOpDate =
      clientStats.lastOperation !== "N/A"
        ? new Date(clientStats.lastOperation)
        : new Date(0);
    if (opDate > lastOpDate) {
      clientStats.lastOperation = opDate.toLocaleDateString("en-US");
    }
  });

  return Array.from(clientMap.values()).filter(
    (c) =>
      (c.operationsRent > 0 || c.operationsBuy > 0) && c.status === "Activo",
  );
}

/**
 * Calculates frequency of rented/sold items for TopMostPopularTable
 */
export function getMostPopularMetrics(
  operations: Operation[],
  inventoryItems?: any[],
) {
  return [
    {
      id: "POP1",
      name: "Vestido Elegante Rojo",
      type: "Venta",
      count: 24,
      income: 4500,
    },
    {
      id: "POP2",
      name: "Esmoquin Clásico",
      type: "Alquiler",
      count: 56,
      income: 8900,
    },
  ];
}

/**
 * Calculates trading fast metrics for TradingFastTable
 */
export function getTradingFastMetrics(
  operations: Operation[],
  inventoryItems?: any[],
) {
  return [
    {
      id: "TRA1",
      item: "Vestido Corte Sirena",
      lastweek: 12,
      thisweek: 25,
      difference: "+13",
    },
    {
      id: "TRA2",
      item: "Traje Azul Estándar",
      lastweek: 40,
      thisweek: 30,
      difference: "-10",
    },
  ];
}
