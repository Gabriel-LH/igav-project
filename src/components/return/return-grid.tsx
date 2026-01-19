"use client";

import { ReturnActionCard } from "./return-action-card";
import { ReturnStats } from "./return-stats";
import { useReservationStore } from "@/src/store/useReservationStore";

export const ReturnGrid = () => {
  const { reservations } = useReservationStore();

  // 1. Filtramos: Solo lo que está en manos del cliente
  // Asegúrate que el string 'entregado' coincida exactamente con el status que pones en tu store al entregar
  const rentalsInStreet = reservations.filter(
    (res) => res.status === "entregado" || res.status === "entregada"
  );

  const today = new Date().setHours(0, 0, 0, 0);

  const dueToday = rentalsInStreet.filter(
    (res) => new Date(res.endDate).setHours(0, 0, 0, 0) === today
  );

  const overdue = rentalsInStreet.filter(
    (res) => new Date(res.endDate).setHours(0, 0, 0, 0) < today
  );

  return (
    <div className="w-full">
      <ReturnStats reservations={dueToday} overdue={overdue} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* CORRECCIÓN: Mapeamos la lista filtrada en lugar de usar reservations[0] */}
        {rentalsInStreet.length > 0 ? (
          rentalsInStreet.map((res) => (
            <ReturnActionCard key={res.id} reservation={res} />
          ))
        ) : (
          <div className="col-span-full py-10 text-center text-slate-400">
            No hay devoluciones pendientes.
          </div>
        )}
      </div>
    </div>
  );
};
