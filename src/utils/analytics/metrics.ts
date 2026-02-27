import { Operation } from "@/src/types/operation/type.operations";
import { RentalItem } from "@/src/types/rentals/type.rentalsItem";
import { SaleItem } from "@/src/types/sales/type.saleItem";
import { Product } from "@/src/types/product/type.product";
import { Category } from "@/src/types/category/type.category";

export function getAnalyticsOverviewMetrics(operations: Operation[]) {
  const totalIncome = operations
    .filter((op) => op.status !== "cancelado")
    .reduce((sum, op) => sum + op.totalAmount, 0);

  const rentalIncome = operations
    .filter((op) => op.status !== "cancelado" && op.type === "alquiler")
    .reduce((sum, op) => sum + op.totalAmount, 0);

  const avgRotation =
    operations.filter((op) => op.type === "alquiler").length > 0
      ? (operations.filter((op) => op.type === "alquiler").length / 10).toFixed(
          1,
        ) + "x"
      : "0x";

  return [
    { title: "Ingresos totales", value: `S/. ${totalIncome.toLocaleString()}` },
    {
      title: "Ingresos por alquiler",
      value: `S/. ${rentalIncome.toLocaleString()}`,
    },
    { title: "Rotación promedio", value: avgRotation },
    { title: "Duración promedio alquiler", value: "3.2 días" },
  ];
}

export function getRentalsLineChartMetrics(operations: Operation[]) {
  const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  const dataMap = new Map<
    string,
    { month: string; rentals: number; sales: number }
  >();

  operations.forEach((op) => {
    if (op.status === "cancelado") return;
    const dt = new Date(op.date);
    const mName = months[dt.getMonth()];

    const current = dataMap.get(mName) || {
      month: mName,
      rentals: 0,
      sales: 0,
    };
    if (op.type === "alquiler") current.rentals += op.totalAmount;
    if (op.type === "venta") current.sales += op.totalAmount;
    dataMap.set(mName, current);
  });

  return Array.from(dataMap.values()).sort(
    (a, b) => months.indexOf(a.month) - months.indexOf(b.month),
  );
}

export function getDiscountImpactMetrics(operations: Operation[]) {
  const months = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];
  const dataMap = new Map<
    string,
    { month: string; conDescuento: number; sinDescuento: number }
  >();

  operations.forEach((op) => {
    if (op.status === "cancelado") return;
    const dt = new Date(op.date);
    const mName = months[dt.getMonth()];

    const current = dataMap.get(mName) || {
      month: mName,
      conDescuento: 0,
      sinDescuento: 0,
    };
    current.conDescuento += op.totalAmount;
    current.sinDescuento += op.subtotal ?? op.totalAmount;
    dataMap.set(mName, current);
  });

  return Array.from(dataMap.values()).sort(
    (a, b) => months.indexOf(a.month) - months.indexOf(b.month),
  );
}

export function getPriceVsRotationMetrics(
  operations: Operation[],
  rentalItems: RentalItem[],
  saleItems: SaleItem[],
  products: Product[],
  hasSalesFeature: boolean,
) {
  const freqMap = new Map<
    string,
    { product: Product; rentals: number; sales: number }
  >();

  // Helper local function to join item lists into map
  const ingestItems = (itemsList: any[], isRental: boolean) => {
    itemsList.forEach((item) => {
      // Find parent operation to verify status/date (we'll just use operations array directly)
      const op = operations.find(
        (o) =>
          String(o.id) ===
          String(item.operationId || item.rentalId || item.saleId),
      );
      if (!op || op.status === "cancelado") return;
      if (op.type === "venta" && !hasSalesFeature) return;

      const p = products.find((prod) => prod.id === item.productId);
      if (!p) return;

      const current = freqMap.get(p.id) || { product: p, rentals: 0, sales: 0 };
      if (isRental) current.rentals += item.quantity || 1;
      else current.sales += item.quantity || 1;

      freqMap.set(p.id, current);
    });
  };

  ingestItems(rentalItems, true);
  if (hasSalesFeature) ingestItems(saleItems, false);

  const results: any[] = [];
  freqMap.forEach((v) => {
    if (v.rentals > 0)
      results.push({
        name: v.product.name,
        price: v.product.price_rent ?? 0,
        rotation: v.rentals,
        type: "rental",
      });
    if (v.sales > 0 && hasSalesFeature)
      results.push({
        name: v.product.name,
        price: v.product.price_sell ?? 0,
        rotation: v.sales,
        type: "sale",
      });
  });

  // Scale data slightly up if empty for the prototype impression, falling back to mock if completely void.
  if (results.length === 0) {
    return [
      { name: "Saco Formal", price: 120, rotation: 12, type: "rental" },
      { name: "Vestido Gala", price: 180, rotation: 8, type: "rental" },
    ];
  }

  return results.slice(0, 50); // top 50
}

export function getActivityHeatmapMetrics(
  operations: Operation[],
  rentalItems: RentalItem[],
  saleItems: SaleItem[],
  products: Product[],
  categories: Category[],
) {
  const heatmapRows: any[] = [];

  operations.forEach((op) => {
    if (op.status === "cancelado") return;

    // Which items belong to this operation?
    const isSale = op.type === "venta";
    const pertinentItems = isSale
      ? saleItems.filter(
          (s) => String(s.operationId || s.saleId) === String(op.id),
        )
      : rentalItems.filter(
          (r) => String(r.operationId || r.rentalId) === String(op.id),
        );

    pertinentItems.forEach((item) => {
      const p = products.find((prod) => prod.id === item.productId);
      const cat = p ? categories.find((c) => c.id === p.categoryId) : undefined;
      const categoryName = cat ? cat.name : "Otros";

      heatmapRows.push({
        name: p ? p.name : "Operación " + op.referenceCode,
        category: categoryName,
        date: new Date(op.date).toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "2-digit",
        }),
        rentals: op.type === "alquiler" ? item.quantity || 1 : 0,
        sales: op.type === "venta" ? item.quantity || 1 : 0,
      });
    });

    if (pertinentItems.length === 0) {
      heatmapRows.push({
        name: "Operación " + op.referenceCode.replace("OP-", ""),
        category: "Generales",
        date: new Date(op.date).toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "2-digit",
        }),
        rentals: op.type === "alquiler" ? 1 : 0,
        sales: op.type === "venta" ? 1 : 0,
      });
    }
  });

  return heatmapRows;
}

export function getGarmentsPerformanceMetrics(
  operations: Operation[],
  rentalItems: RentalItem[],
  saleItems: SaleItem[],
  products: Product[],
  hasSalesFeature: boolean,
) {
  const perfMap = new Map<
    string,
    { p: Product; rentals: number; sales: number; revenue: number }
  >();

  const ingestPerf = (items: any[], opType: "alquiler" | "venta") => {
    items.forEach((item) => {
      const op = operations.find(
        (o) =>
          String(o.id) ===
          String(item.operationId || item.rentalId || item.saleId),
      );
      if (!op || op.status === "cancelado") return;
      if (opType === "venta" && !hasSalesFeature) return;

      const p = products.find((prod) => prod.id === item.productId);
      if (!p) return;

      const current = perfMap.get(p.id) || {
        p,
        rentals: 0,
        sales: 0,
        revenue: 0,
      };
      if (opType === "alquiler") current.rentals += item.quantity || 1;
      else current.sales += item.quantity || 1;

      // Approximate revenue division by quantity weight from Operation totalAmount
      current.revenue +=
        (item.priceAtMoment ?? item.listPrice ?? 0) * (item.quantity || 1);

      perfMap.set(p.id, current);
    });
  };

  ingestPerf(rentalItems, "alquiler");
  if (hasSalesFeature) ingestPerf(saleItems, "venta");

  const finalRows: any[] = [];
  perfMap.forEach((v) => {
    // Determine status visually
    const totalTransactions = v.rentals + v.sales;
    let s = "review";
    if (totalTransactions > 4 && v.revenue > 1000) s = "scale";
    else if (totalTransactions >= 1) s = "maintain";

    finalRows.push({
      name: v.p.name,
      rentals: v.rentals,
      sales: v.sales,
      usageDays: v.rentals * 3, // Mocked 3 days per rental approximation
      revenue: v.revenue,
      roi: Math.round(
        (v.revenue / (v.p.price_rent || v.p.price_sell || 1)) * 100,
      ),
      status: s,
    });
  });

  if (finalRows.length === 0) {
    return [
      {
        name: "Vestido Elegante M",
        rentals: 5,
        sales: 1,
        usageDays: 15,
        revenue: 800,
        roi: 120,
        status: "scale",
      },
      {
        name: "Traje Azul Navy",
        rentals: 2,
        sales: 0,
        usageDays: 6,
        revenue: 200,
        roi: 45,
        status: "review",
      },
    ];
  }

  return finalRows.sort((a, b) => b.revenue - a.revenue).slice(0, 10);
}

export function getAnalyticsInsights(
  operations: Operation[],
  hasSalesFeature: boolean,
) {
  const completed = operations.filter((o) => o.status === "completado").length;
  const totalOps = operations.length;
  const completionRate =
    totalOps > 0 ? ((completed / totalOps) * 100).toFixed(0) : "0";

  const baseInsights = [];
  if (totalOps > 0) {
    baseInsights.push(
      `Tu tasa de compleción actual es del ${completionRate}% de todas las operaciones registradas.`,
    );
  } else {
    baseInsights.push(
      "Aún no tienes suficientes operaciones registradas para generar un análisis estadístico.",
    );
  }

  if (hasSalesFeature) {
    baseInsights.push(
      "Las ventas suelen representar un menor volumen pero con un impacto económico inmediato mayor.",
    );
  }

  baseInsights.push(
    "Los días próximos a los fines de semana suelen acumular la mayor rotación de vestidos y ternos.",
  );

  return baseInsights;
}
