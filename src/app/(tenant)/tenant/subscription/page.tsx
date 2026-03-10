import { SubscriptionHeader } from "@/src/components/tenant/subscription/subscription-header";
import { SubscriptionLayout } from "@/src/components/tenant/subscription/suscription-layout";
import { getTenantSubscriptionDataAction } from "@/src/app/(tenant)/tenant/actions/subscription.actions";

export default async function SubscriptionPage() {
  const data = await getTenantSubscriptionDataAction();

  return (
    <div className="flex flex-col gap-6 p-6">
      <SubscriptionHeader />
      <SubscriptionLayout
        subscription={data?.subscription ?? null}
        plans={data?.plans ?? []}
        currentUsage={data?.usage ?? null}
        hasPaymentMethod={data?.hasPaymentMethod ?? false}
      />
    </div>
  );
}
