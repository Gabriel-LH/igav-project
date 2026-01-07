// app/(admin)/dashboard/page.tsx
import { ChartAreaInteractive } from "@/src/components/dashboard/chart-area-interactive";
import { SectionCards } from "@/src/components/dashboard/section-cards";
import dataClient from "./dataClient.json";
import dataPopular from "./dataPopular.json";
import dataTrading from "./dataTrading.json";
import { DataTable } from "@/src/components/data-table/data-table";
import { DashboardHeader } from "@/src/components/dashboard/dashboard-header";

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <DashboardHeader />
          <SectionCards />
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive />
          </div>
          <DataTable
            dataClient={dataClient}
            dataPopular={dataPopular}
            dataTrading={dataTrading}
          />
        </div>
      </div>
    </div>
  );
}
