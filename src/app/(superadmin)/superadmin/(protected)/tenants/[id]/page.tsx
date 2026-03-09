import { TenantIdLayout } from "@/src/components/superadmin/tenants/id-tenant-layout";
import { getTenantDetails } from "@/src/app/(superadmin)/superadmin/actions/tenant.actions";
import { notFound } from "next/navigation";

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const details = await getTenantDetails(id);

  if (!details) {
    notFound();
  }

  return <TenantIdLayout initialData={details} />;
}
