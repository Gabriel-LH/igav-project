"use client";

import { useReservationStore } from "@/src/store/useReservationStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/src/utils/currency-format";

export const RentalsTab = () => {
  const { reservations } = useReservationStore();

  // Filtros por Status
  const activos = reservations.filter((r) => r.status === "entregado");
  const historial = reservations.filter((r) => r.status === "finalizado");
  const cancelados = reservations.filter((r) => r.status === "cancelado");

  // Cálculo de métricas rápidas (Auditoría)
  const totalIngresos = reservations.reduce(
    (acc, res) => acc + (res.total || 0),
    0
  );
  return (
    <>
      <div className="flex justify-between items-end mb-8">
        <Tabs defaultValue="activos" className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="activos" className="font-bold">
              Activos ({activos.length})
            </TabsTrigger>
            <TabsTrigger value="historial" className="font-bold">
              Historial
            </TabsTrigger>
            <TabsTrigger value="cancelados" className="font-bold">
              Cancelados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="activos" className="space-y-2">
            {/* Aquí podrías usar una tabla más densa para ver mucha info de un vistazo */}
            {/*<RentalTable data={activos} />*/}
          </TabsContent>

          <TabsContent value="historial">
            {/*<RentalTable data={historial} />*/}
          </TabsContent>
        </Tabs>

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
