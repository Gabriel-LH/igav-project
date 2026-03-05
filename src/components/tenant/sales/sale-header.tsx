import { SalesTab } from "./sales-tab";

export function SalesHeader() {
  return (
    <div className="flex justify-between ">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold">Ventas</h1>
        <p className="text-muted-foreground">
          Historial de ventas y metricas de rendimiento.
        </p>
      </div>
      <SalesTab />
    </div>
  );
}
