import { TransferHeader } from "@/src/components/inventory/inventory/transfers/transfer-header";
import { TransferLayout } from "@/src/components/inventory/inventory/transfers/transfer-layout";

export default function TransfersPage() {
   return (
      <div className="flex flex-col gap-6 p-6">
        <TransferHeader />
        <TransferLayout />
      </div>
    );
}