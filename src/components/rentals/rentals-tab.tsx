"use client";

import { useReservationStore } from "@/src/store/useReservationStore";
import { formatCurrency } from "@/src/utils/currency-format";

export const RentalsTab = () => {
  const { reservations } = useReservationStore();

  // Cálculo de métricas rápidas (Auditoría)
  const totalIngresos = reservations.reduce(
    (acc, res) => acc + (res.total || 0),
    0
  );
  return (
    <>
      <div className="flex justify-between items-end mb-8">
        <div className="text-right bg-primary/5 p-3 rounded-xl border border-primary/10">
          <p className="text-[10px] font-bold uppercase text-primary">
            Ingresos Totales (Mes)
          </p>
          <p className="text-xl font-black">{formatCurrency(totalIngresos)}</p>
        </div>
      </div>
    </>
  );
};
