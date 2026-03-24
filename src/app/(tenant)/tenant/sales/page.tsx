import { SalesHeader } from "@/src/components/tenant/sales/sale-header";
import { SalesGrid } from "@/src/components/tenant/sales/sales-grid";
import { getSalesGridAction } from "@/src/app/(tenant)/tenant/actions/operation.actions";
import { requireTenantMembership } from "@/src/infrastructure/tenant/auth.guard";

export default async function SalesPage() {
  const access = await requireTenantMembership();
  const salesData = await getSalesGridAction(access.membership!.tenantId);

  return (
    <>
      <div className="flex flex-col gap-6 p-6">
        <SalesHeader />
        <SalesGrid initialData={salesData} />
      </div>
    </>
  );
}
