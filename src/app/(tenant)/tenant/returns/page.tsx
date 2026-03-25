import { ReturnGrid } from "@/src/components/tenant/return/return-grid";
import { ReturnHeader } from "@/src/components/tenant/return/return-header";
import { getReturnsDataAction } from "@/src/app/(tenant)/tenant/actions/operation.actions";
import { requireTenantMembership } from "@/src/infrastructure/tenant/auth.guard";
import { ReturnDataLoader } from "@/src/components/tenant/return/ReturnDataLoader";

export default async function ReturnsPage() {
  const membership = await requireTenantMembership();
  const res = await getReturnsDataAction(membership.membership!.tenantId);
  const data = res.success ? res.data : { rentals: [], rentalItems: [], products: [], customers: [], guarantees: [] };

  return (
    <>
      <div className="flex flex-col gap-6 p-6">
        <ReturnHeader />
        <ReturnDataLoader data={data as any} />
        <ReturnGrid 
          attributeTypes={data.attributeTypes as any || []} 
          attributeValues={data.attributeValues as any || []} 
        />
      </div>
    </>
  );
}
