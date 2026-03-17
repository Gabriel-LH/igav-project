import { ReceiveHeader } from "@/src/components/tenant/inventory/inventory/receive/receive-header";
import { ReceiveModule } from "@/src/components/tenant/inventory/inventory/receive/receive-module";

export default function ReceivePage() {
  return (
    <div className="flex flex-col gap-6 p-6 min-w-0 w-full">
      <ReceiveHeader />
      <ReceiveModule />
    </div>
  );
}
