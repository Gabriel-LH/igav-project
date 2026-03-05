import { SubscriptionHeader } from "@/src/components/tenant/subscription/subscription-header";
import { SubscriptionLayout } from "@/src/components/tenant/subscription/suscription-layout";

export default function SubscriptionPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <SubscriptionHeader />
      <SubscriptionLayout />
    </div>
  );
}
