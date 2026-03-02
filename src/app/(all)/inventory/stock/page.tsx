import { StockHeader } from "@/src/components/inventory/inventory/stock/stock-header";
import { StockLayout } from "@/src/components/inventory/inventory/stock/stock-layout";

export default function StockPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <StockHeader />
      <StockLayout />
    </div>
  );
}