import { DashboardLayout } from "@/src/components/superadmin/dashboard/dashboard-layout";
import { DashboardHeader } from "@/src/components/superadmin/dashboard/dashboard-header";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <DashboardHeader />
      <DashboardLayout />
    </div>
  );
}
