"use client";

import { useSaleStore } from "@/src/store/useSaleStore";
import { formatCurrency } from "@/src/utils/currency-format";

export const SalesTab = () => {
  const { sales } = useSaleStore();

  // Cálculo de métricas rápidas (Auditoría)
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const salesThisMonth = sales.filter((sale) => {
    // Soporte para ambos: Sale (Date) y SaleTableRow (string)
    const rawDate = (sale as any).saleDate || (sale as any).createdAt;
    const saleDate = new Date(rawDate);
    
    return (
      saleDate.getMonth() === currentMonth &&
      saleDate.getFullYear() === currentYear &&
      sale.status !== "cancelado"
    );
  });

  const totalIngresos = salesThisMonth.reduce(
    (acc, res) => acc + ((res as any).income || (res as any).totalAmount || 0),
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
