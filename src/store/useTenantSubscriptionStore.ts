import { create } from "zustand";
import { TenantSubscription } from "@/src/types/tenant/tenantSuscription";

interface TenantSubscriptionState {
  subscriptions: TenantSubscription[];
  setSubscriptions: (subscriptions: TenantSubscription[]) => void;
  getActiveSubscription: (tenantId: string) => TenantSubscription | undefined;
}

export const useTenantSubscriptionStore = create<TenantSubscriptionState>(
  (set, get) => ({
    subscriptions: [],
    setSubscriptions: (subscriptions) => set({ subscriptions }),
    getActiveSubscription: (tenantId) => {
      const { subscriptions } = get();
      return subscriptions.find(
        (sub) => sub.tenantId === tenantId && sub.status === "active",
      );
    },
  }),
);
