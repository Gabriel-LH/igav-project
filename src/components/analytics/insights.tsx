"use client";

// components/analytics/insights.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeatureGuard } from "@/src/components/guards/FeatureGuard";

import { useAnalyticsData } from "@/src/hooks/useAnalyticsData";

export function AnalyticsInsights() {
  const { insightsData: insights } = useAnalyticsData();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Insights automáticos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {insights.map((text) => {
          const isRentSpecific =
            text.toLowerCase().includes("alquiler") ||
            text.toLowerCase().includes("rotación");

          const ItemUI = (
            <p key={text} className="text-sm text-muted-foreground">
              • {text}
            </p>
          );

          if (isRentSpecific) {
            return (
              <FeatureGuard key={text} feature="rentals">
                {ItemUI}
              </FeatureGuard>
            );
          }

          return ItemUI;
        })}
      </CardContent>
    </Card>
  );
}
