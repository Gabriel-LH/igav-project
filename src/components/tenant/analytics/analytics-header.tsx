// components/analytics/analytics-header.tsx
export function AnalyticsHeader() {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-3xl font-bold">Analítica</h1>
      <p className="text-muted-foreground">
        Análisis detallado de ventas y alquileres por rango de fechas
      </p>
    </div>
  );
}
