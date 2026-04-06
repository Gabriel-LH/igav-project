// app/(admin)/dashboard/page.tsx
import { ChartAreaInteractive } from "@/src/components/tenant/dashboard/chart-area-interactive";
import { SectionCards } from "@/src/components/tenant/dashboard/section-cards";
import { DataTable } from "@/src/components/tenant/dashboard/data-table/data-table";
import { DashboardHeader } from "@/src/components/tenant/dashboard/dashboard-header";
import { DashboardDataLoader } from "@/src/components/tenant/dashboard/dashboard-data-loader";

export default function AdminDashboardPage() {
  return (
    <DashboardDataLoader>
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <DashboardHeader />
            <SectionCards />
            <div className="px-4 lg:px-6">
              <ChartAreaInteractive />
            </div>
            <DataTable />
          </div>
        </div>
      </div>
    </DashboardDataLoader>
  );
}
