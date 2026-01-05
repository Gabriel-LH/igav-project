import { PriceVsRotationChart } from "./charts/price-vs-rotation";
import { RentalsLineChart } from "./charts/rentals-line-chart";
import { ActivityHeatmap } from "./charts/activity-heatmap";
export function AnalyticsCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <RentalsLineChart />
      <PriceVsRotationChart />
      <div className="lg:col-span-2">
        <ActivityHeatmap />
      </div>
    </div>
  );
}
