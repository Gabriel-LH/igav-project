import { create } from "zustand";
import { TENTANT_SUBSCRIPTIONS_MOCK } from "@/src/mocks/mock.tenantSuscription";
import { TenantSubscription } from "@/src/types/tenant/tenantSuscription";

interface TenantSubscriptionState {
  subscriptions: TenantSubscription[];
  getActiveSubscription: (tenantId: string) => TenantSubscription | undefined;
}

export const useTenantSubscriptionStore = create<TenantSubscriptionState>(
  (set, get) => ({
    subscriptions: TENTANT_SUBSCRIPTIONS_MOCK,
    getActiveSubscription: (tenantId) => {
      const { subscriptions } = get();
      return subscriptions.find(
        (sub) => sub.tenantId === tenantId && sub.status === "active",
      );
    },
  }),
);
