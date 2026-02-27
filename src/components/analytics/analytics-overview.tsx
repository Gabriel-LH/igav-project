"use client";

// components/analytics/analytics-overview.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeatureGuard } from "@/src/components/guards/FeatureGuard";

import { useAnalyticsData } from "@/src/hooks/useAnalyticsData";

export function AnalyticsOverview() {
  const { overviewData, hasSalesFeature } = useAnalyticsData();

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {overviewData.map((stat) => {
        const isRentSpecific =
          stat.title.toLowerCase().includes("alquiler") ||
          stat.title.toLowerCase().includes("rotación");

        const CardUI = (
          <Card key={stat.title}>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">
              {stat.value}
            </CardContent>
          </Card>
        );

        if (isRentSpecific) {
          return (
            <FeatureGuard key={stat.title} feature="rentals">
              {CardUI}
            </FeatureGuard>
          );
        }

        return CardUI;
      })}
    </div>
  );
}
