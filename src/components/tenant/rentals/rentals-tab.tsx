"use client";

import { useRentalStore } from "@/src/store/useRentalStore";
import { formatCurrency } from "@/src/utils/currency-format";

export const RentalsTab = () => {
  const { rentals } = useRentalStore();

  // Cálculo de métricas rápidas (Auditoría)
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const rentalsThisMonth = rentals.filter((rental) => {
    // Note: Supporting both Rental/Operation (Date) and RentalTableRow (string)
    const rawDate = (rental as any).outDate || (rental as any).date || rental.createdAt;
    const rentalDate = new Date(rawDate);
    
    return (
      rentalDate.getMonth() === currentMonth &&
      rentalDate.getFullYear() === currentYear &&
      rental.status !== "anulado"
    );
  });

  const totalIngresos = rentalsThisMonth.reduce(
    (acc, res) => acc + ((res as any).income || (res as any).totalAmount || 0),
    0,
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
