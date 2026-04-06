import { HomeHeader } from "@/src/components/tenant/home/home-header";
import { ProductGrid } from "@/src/components/tenant/home/home-product-grid";
import { getCategoriesAction } from "@/src/app/(tenant)/tenant/actions/category.actions";
import {
  getAttributeTypesAction,
  getAttributeValuesAction,
} from "@/src/app/(tenant)/tenant/actions/attribute.actions";
import { checkAndExpireReservationsAction } from "@/src/app/(tenant)/tenant/actions/reservation.actions";
import { requireTenantMembership } from "@/src/infrastructure/tenant/auth.guard";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const access = await requireTenantMembership().catch(() => null);
  if (!access) {
    redirect("/auth/login");
  }
  if (access.user.globalRole === "SUPER_ADMIN") {
    redirect("/superadmin/dashboard");
  }
  if (!access.membership) {
    redirect("/auth/login?error=no_tenant_membership");
  }

  const [categoriesResult, attributeTypesResult, attributeValuesResult, _expireResult] =
    await Promise.all([
      getCategoriesAction(),
      getAttributeTypesAction(),
      getAttributeValuesAction(),
      checkAndExpireReservationsAction(),
    ]);


  const categories = categoriesResult.success ? (categoriesResult.data ?? []) : [];
  const attributeTypes = attributeTypesResult.success
    ? (attributeTypesResult.data ?? [])
    : [];
  const attributeValues = attributeValuesResult.success
    ? (attributeValuesResult.data ?? [])
    : [];

  return (
    <>
      <div className="flex flex-col gap-6 p-6">
        <HomeHeader />
        <ProductGrid
          categories={categories}
          attributeTypes={attributeTypes}
          attributeValues={attributeValues}
        />
      </div>
    </>
  );
}
