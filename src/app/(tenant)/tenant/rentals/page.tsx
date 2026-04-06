import { RentalsHeader } from "@/src/components/tenant/rentals/rental-header";
import { RentalsGrid } from "@/src/components/tenant/rentals/rentals-grid";
import { getRentalsGridAction } from "@/src/app/(tenant)/tenant/actions/operation.actions";
import { requireTenantMembership } from "@/src/infrastructure/tenant/auth.guard";
import { RentalHydrator } from "@/src/components/tenant/rentals/RentalHydrator";

export default async function RentalsPage() {
  const access = await requireTenantMembership();
  const rentalsData = await getRentalsGridAction(access.membership!.tenantId);

  return (
    <>
      <RentalHydrator data={rentalsData} />
      <div className="flex flex-col gap-6 p-6">
        <RentalsHeader />
        <RentalsGrid initialData={rentalsData} />
      </div>
    </>
  );
}
