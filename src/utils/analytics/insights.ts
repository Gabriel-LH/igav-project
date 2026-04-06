import { formatCurrency } from "../currency-format";
import { Operation } from "@/src/types/operation/type.operations";
import { RentalItem } from "@/src/types/rentals/type.rentalsItem";
import { SaleItem } from "@/src/types/sales/type.saleItem";
import { ReservationItem } from "@/src/types/reservation/type.reservationItem";
import { Sale } from "@/src/types/sales/type.sale";

export function buildAnalyticsInsights(
  operations: Operation[],
  rentalItems: RentalItem[] = [],
  saleItems: SaleItem[] = [],
  reservationItems: ReservationItem[] = [],
  sales: Sale[] = [],
  hasSalesFeature: boolean = false,
) {
  const activeOps = operations.filter((operation) => operation.status !== "cancelado");
  const filteredOpIds = new Set([
    ...rentalItems.map((item) => String(item.operationId || item.rentalId)),
    ...reservationItems.map((item) =>
      String(item.operationId || item.reservationId),
    ),
    ...saleItems.map((item) => {
      const sale = sales.find(
        (currentSale) => String(currentSale.id) === String(item.saleId),
      );
      return sale ? String(sale.operationId) : String(item.saleId);
    }),
  ]);

  const relevantOps = activeOps.filter((operation) =>
    filteredOpIds.size > 0 ? filteredOpIds.has(String(operation.id)) : true,
  );

  const totalOps = relevantOps.length;
  if (totalOps === 0) {
    return ["Aún no hay operaciones suficientes para este filtrado."];
  }

  const totalIncome = relevantOps.reduce(
    (sum, operation) => sum + (operation.totalAmount || 0),
    0,
  );
  const completedCount = relevantOps.filter(
    (operation) => operation.status === "completado",
  ).length;
  const chargeableOps = relevantOps.filter(
    (operation) => operation.type !== "reserva",
  );
  const fullyPaidChargeableOps = chargeableOps.filter(
    (operation) => operation.paymentStatus === "pagado",
  ).length;
  const chargeableOpsPendingCollection = chargeableOps.filter(
    (operation) => operation.paymentStatus !== "pagado",
  ).length;
  const pendingActionCount = relevantOps.filter(
    (operation) =>
      operation.status === "pendiente" || operation.status === "en_progreso",
  ).length;
  const discountedOps = relevantOps.filter(
    (operation) => (operation.discountAmount || 0) > 0,
  );
  const totalDiscount = discountedOps.reduce(
    (sum, operation) => sum + (operation.discountAmount || 0),
    0,
  );

  const revenueByType = {
    alquiler: relevantOps
      .filter((operation) => operation.type === "alquiler")
      .reduce((sum, operation) => sum + (operation.totalAmount || 0), 0),
    venta: relevantOps
      .filter((operation) => operation.type === "venta")
      .reduce((sum, operation) => sum + (operation.totalAmount || 0), 0),
    reserva: relevantOps
      .filter((operation) => operation.type === "reserva")
      .reduce((sum, operation) => sum + (operation.totalAmount || 0), 0),
  };

  const volumeByType = {
    alquiler: relevantOps.filter((operation) => operation.type === "alquiler").length,
    venta: relevantOps.filter((operation) => operation.type === "venta").length,
    reserva: relevantOps.filter((operation) => operation.type === "reserva").length,
  };

  const insights: string[] = [];
  const completionRate = Math.round((completedCount / totalOps) * 100);
  const paidRate =
    chargeableOps.length > 0
      ? Math.round((fullyPaidChargeableOps / chargeableOps.length) * 100)
      : 100;
  const averageTicket = totalIncome / totalOps;

  insights.push(
    `De cada 100 operaciones del periodo, ${completionRate} ya quedaron cerradas.`,
  );
  insights.push(`El ticket promedio del periodo es ${formatCurrency(averageTicket)}.`);

  if (chargeableOps.length > 0) {
    if (chargeableOpsPendingCollection === 0) {
      insights.push(
        "No se observan ventas o alquileres con cobro pendiente en este filtrado.",
      );
    } else {
      insights.push(
        `${paidRate}% de las ventas y alquileres ya quedaron cobrados por completo; conviene revisar las ${chargeableOpsPendingCollection} operaciones restantes.`,
      );
    }
  }

  if (pendingActionCount > 0) {
    insights.push(
      `Hay ${pendingActionCount} operaciones que todavía requieren seguimiento del equipo.`,
    );
  }

  if (discountedOps.length > 0) {
    const discountPenetration = Math.round(
      (discountedOps.length / totalOps) * 100,
    );
    const averageDiscount = totalDiscount / discountedOps.length;
    insights.push(
      `Los descuentos aparecieron en ${discountPenetration}% de las operaciones y el ahorro promedio fue de ${formatCurrency(averageDiscount)}.`,
    );
  }

  const rankedRevenueTypes = Object.entries(revenueByType)
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1]);

  if (rankedRevenueTypes.length > 0) {
    const [topType, topRevenue] = rankedRevenueTypes[0];
    const topShare = totalIncome > 0 ? Math.round((topRevenue / totalIncome) * 100) : 0;
    const typeLabel =
      topType === "alquiler"
        ? "alquiler"
        : topType === "venta"
          ? "venta"
          : "reservas";
    insights.push(
      `La principal fuente de ingresos del periodo fue ${typeLabel}, con ${topShare}% del total.`,
    );
  }

  if (hasSalesFeature && revenueByType.alquiler > 0 && revenueByType.venta > 0) {
    const gap = Math.abs(revenueByType.alquiler - revenueByType.venta);
    const leader =
      revenueByType.alquiler >= revenueByType.venta ? "alquiler" : "venta";
    insights.push(
      `En este periodo, ${leader} generó ${formatCurrency(gap)} más que la otra línea principal.`,
    );
  }

  if (volumeByType.reserva > 0) {
    const reservationShare = Math.round((volumeByType.reserva / totalOps) * 100);
    insights.push(
      `Las reservas ya representan ${reservationShare}% del movimiento del periodo; vale la pena vigilar cuántas terminan convirtiéndose.`,
    );
  }

  return insights;
}
