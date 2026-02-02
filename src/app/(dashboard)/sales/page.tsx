import { SalesHeader } from "@/src/components/sales/sale-header";
import { SalesGrid } from "@/src/components/sales/sales-grid";

export default function SalesPage() {
  return (
    <>
      <div className="flex flex-col gap-6 p-6">
        <SalesHeader />
        <SalesGrid />
      </div>
    </>
  );
}
