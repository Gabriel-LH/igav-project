import { SalesHeader } from "@/src/components/sales/sale-header";
import { SalesGrid } from "@/src/components/sales/sales-grid";

export default function SalesPage() {
  return (
    <>
      <div className="flex flex-col gap-6 p-6">
        <SalesHeader />
        <SalesGrid />
         {/* <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-secondary border-t-primary" /> */}
         {/* <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-primary/10 border-t-primary border-b-primary" /> */}
      </div>
    </>
  );
}
