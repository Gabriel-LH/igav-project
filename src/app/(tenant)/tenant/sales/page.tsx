import { SalesHeader } from "@/src/components/tenant/sales/sale-header";
import { SalesGrid } from "@/src/components/tenant/sales/sales-grid";
import {
  getSalesGridAction,
  getSalesStoreDataAction,
} from "@/src/app/(tenant)/tenant/actions/operation.actions";
import { requireTenantMembership } from "@/src/infrastructure/tenant/auth.guard";
import { SaleHydrator } from "@/src/components/tenant/sales/SaleHydrator";

export default async function SalesPage() {
  const access = await requireTenantMembership();
  const tenantId = access.membership!.tenantId;
  const [salesData, salesStoreData] = await Promise.all([
    getSalesGridAction(tenantId),
    getSalesStoreDataAction(tenantId),
  ]);

  return (
    <>
      <SaleHydrator data={salesStoreData} />
      <div className="flex flex-col gap-6 p-6">
        <SalesHeader />
        <SalesGrid initialData={salesData} />
      </div>
    </>
  );
}
