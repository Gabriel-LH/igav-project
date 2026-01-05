// components/analytics/insights.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const insights = [
  "Los viernes generan un 28% más alquileres que el promedio",
  "Los vestidos largos tienen menor rotación pero mayor ingreso",
  "Entre el día 10 y 20 del mes baja la demanda",
];

export function AnalyticsInsights() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Insights automáticos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {insights.map((text) => (
          <p key={text} className="text-sm text-muted-foreground">
            • {text}
          </p>
        ))}
      </CardContent>
    </Card>
  );
}
