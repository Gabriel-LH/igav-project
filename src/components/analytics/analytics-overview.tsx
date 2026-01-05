// components/analytics/analytics-overview.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const mockStats = [
  { title: "Ingresos totales", value: "$48,200" },
  { title: "Ingresos por alquiler", value: "$31,600" },
  { title: "Rotación promedio", value: "4.3x" },
  { title: "Duración promedio alquiler", value: "5.6 días" },
];

export function AnalyticsOverview() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {mockStats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              {stat.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{stat.value}</CardContent>
        </Card>
      ))}
    </div>
  );
}
