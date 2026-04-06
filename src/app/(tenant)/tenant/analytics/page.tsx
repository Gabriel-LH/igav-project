import { AnalyticsCharts } from "@/src/components/tenant/analytics/analytics-charts";
import { AnalyticsFilters } from "@/src/components/tenant/analytics/analytics-filters";
import { AnalyticsHeader } from "@/src/components/tenant/analytics/analytics-header";
import { AnalyticsOverview } from "@/src/components/tenant/analytics/analytics-overview";
import { AnalyticsInsights } from "@/src/components/tenant/analytics/insights";
import { GarmentsPerformanceTable } from "@/src/components/tenant/analytics/tables/garments-performance-table";
import { DashboardDataLoader } from "@/src/components/tenant/dashboard/dashboard-data-loader";

export default function AnalyticsPage() {
  return (
    <DashboardDataLoader>
      <div className="flex flex-col gap-6 p-6">
        <AnalyticsHeader />
        <AnalyticsFilters />
        <AnalyticsOverview />
        <AnalyticsCharts />
        <GarmentsPerformanceTable />
        <AnalyticsInsights />
      </div>
    </DashboardDataLoader>
  );
}
