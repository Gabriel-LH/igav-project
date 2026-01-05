import { AnalyticsCharts } from "@/src/components/analytics/analytics-charts";
import { AnalyticsFilters } from "@/src/components/analytics/analytics-filters";
import { AnalyticsHeader } from "@/src/components/analytics/analytics-header";
import { AnalyticsOverview } from "@/src/components/analytics/analytics-overview";
import { AnalyticsInsights } from "@/src/components/analytics/insights";
import { GarmentsPerformanceTable } from "@/src/components/analytics/tables/garments-performance-table";

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <AnalyticsHeader />
      <AnalyticsFilters />
      <AnalyticsOverview />
      <AnalyticsCharts />
      <GarmentsPerformanceTable />
      <AnalyticsInsights />
    </div>
  );
}
