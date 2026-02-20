import { RentalsTab } from "./rentals-tab";

export function RentalsHeader() {
  return (
    <div className="flex justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold">Alquileres</h1>
        <p className="text-muted-foreground">
          Historial de alquileres y metricas de rendimiento.
        </p>
      </div>

      <RentalsTab />
    </div>
  );
}
