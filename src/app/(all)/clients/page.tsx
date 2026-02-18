import { ClientHeader } from "@/src/components/client/client-header";
import { ClientLayout } from "@/src/components/client/client-layout";

export default function ClientsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <ClientHeader />
      <ClientLayout />
    </div>
  );
}
