import { ClientHeader } from "@/src/components/tenant/client/client-header";
import { ClientLayout } from "@/src/components/tenant/client/client-layout";

export default function ClientsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <ClientHeader />
      <ClientLayout />
    </div>
  );
}
