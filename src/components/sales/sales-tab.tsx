"use client";

import { useSaleStore } from "@/src/store/useSaleStore";
import { formatCurrency } from "@/src/utils/currency-format";

export const SalesTab = () => {
  const { sales } = useSaleStore();

  // Cálculo de métricas rápidas (Auditoría)
  const totalIngresos = sales.reduce(
    (acc, res) => acc + (res.totalAmount || 0),
    0
  );
  return (
    <>
      <div className="flex justify-between items-end mb-3">
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
