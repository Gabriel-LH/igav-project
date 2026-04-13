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
import { getBranchInventoryAction } from "@/src/app/(tenant)/tenant/actions/inventory.actions";
import { getAvailabilityCalendarDataAction } from "@/src/app/(tenant)/tenant/actions/availability.actions";

export default async function HomePage() {
  // 1. Verificación de acceso unificada
  // El Middleware (proxy.ts) ya garantiza que hay sesión. 
  // Aquí solo verificamos la membresía al tenant.
  let access;
  try {
    access = await requireTenantMembership();
  } catch (error: any) {
    console.log("[HOME_PAGE] Guard failed:", error.message);
    if (error.message === "AUTH_SESSION_MISSING") {
      return redirect("/auth/login?error=login_required");
    }
    if (error.message === "AUTH_NO_MEMBERSHIP") {
      return redirect("/auth/login?error=no_membership");
    }
    return redirect("/auth/login?error=unauthorized");
  }

  if (access.user.globalRole === "SUPER_ADMIN") {
    return redirect("/superadmin/dashboard");
  }

  if (!access.membership) {
    return redirect("/auth/login?error=no_membership");
  }

  const membership = access.membership;
  const branchId = membership.defaultBranchId;

  // 2. Ejecución de acciones en paralelo para minimizar LCP
  // Cargamos categorías, atributos e inventario BASE (sucursal por defecto)
  const [
    categoriesResult,
    attributeTypesResult,
    attributeValuesResult,
    inventoryResult,
    availabilityResult,
  ] = await Promise.all([
    getCategoriesAction(),
    getAttributeTypesAction(),
    getAttributeValuesAction(),
    branchId ? getBranchInventoryAction(branchId) : Promise.resolve({ success: false, data: null }),
    getAvailabilityCalendarDataAction(),
  ]);

  // Ejecutamos la expiración de forma asíncrona sin bloquear el render
  checkAndExpireReservationsAction().catch(console.error);

  const categories = categoriesResult.success ? (categoriesResult.data ?? []) : [];
  const attributeTypes = attributeTypesResult.success ? (attributeTypesResult.data ?? []) : [];
  const attributeValues = attributeValuesResult.success ? (attributeValuesResult.data ?? []) : [];
  
  const initialInventory = inventoryResult.success ? inventoryResult.data : null;
  const initialAvailability = availabilityResult.success ? availabilityResult.data : null;

  return (
    <div className="flex flex-col gap-6 p-6">
      <HomeHeader />
      <ProductGrid
        categories={categories}
        attributeTypes={attributeTypes}
        attributeValues={attributeValues}
        initialInventory={initialInventory}
        initialAvailability={initialAvailability}
      />
    </div>
  );
}
