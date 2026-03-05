import { PriceVsRotationChart } from "./charts/price-vs-rotation";
import { RentalsLineChart } from "./charts/rentals-line-chart";
import { ActivityHeatmap } from "./charts/activity-heatmap";
import { DiscountImpactChart } from "./charts/discount-impact-chart";

export function AnalyticsCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <RentalsLineChart />
      <PriceVsRotationChart />
      <DiscountImpactChart />
      <div className="lg:col-span-2">
        <ActivityHeatmap />
      </div>
    </div>
  );
}
