"use client";

// components/analytics/analytics-overview.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeatureGuard } from "@/src/components/tenant/guards/FeatureGuard";

import { useAnalyticsData } from "@/src/hooks/useAnalyticsData";

export function AnalyticsOverview() {
  const { overviewData, hasSalesFeature } = useAnalyticsData();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.trend !== undefined && (
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                      stat.trend >= 0
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {stat.trend >= 0 ? "+" : ""}
                    {stat.trend.toFixed(1)}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {stat.trendLabel}
                  </span>
                </div>
              )}
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
