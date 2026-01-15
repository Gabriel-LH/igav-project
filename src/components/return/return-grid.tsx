'use client';

import { ReturnActionCard } from "./return-action-card";
import { ReturnStats } from "./return-stats";
import { useReservationStore } from "@/src/store/useReservationStore"; 

export const ReturnGrid = () => {
  const { reservations } = useReservationStore();

  // 1. Filtramos: Solo lo que está en manos del cliente (entregado)
  const rentalsInStreet = reservations.filter(
    (res) => res.status === "entregado"
  );

  // 2. Sub-filtros para los Tabs de Devoluciones
  const today = new Date().setHours(0, 0, 0, 0);

  const dueToday = rentalsInStreet.filter(
    (res) => new Date(res.endDate).setHours(0, 0, 0, 0) === today
  );

  const overdue = rentalsInStreet.filter(
    (res) => new Date(res.endDate).setHours(0, 0, 0, 0) < today
  );
  return (
    <div className="w-full">
      <ReturnStats reservations={dueToday} overdue={overdue}/>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        <ReturnActionCard reservation={reservations[0]}/>
      </div>
    </div>
  );
};
