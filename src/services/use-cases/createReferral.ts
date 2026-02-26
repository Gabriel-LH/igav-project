import { useCustomerStore } from "@/src/store/useCustomerStore";
import { useCreateClient } from "./createClient.usecase";
import { useReferralStore } from "@/src/store/useReferralStore";
import { CreateClientDTO } from "./createClient.usecase";
import { useTenantStore } from "@/src/store/useTenantStore";

export function useCreateClientWithReferral() {
  const { createClient } = useCreateClient();
  const customers = useCustomerStore((s) => s.customers);
  const addReferral = useReferralStore((s) => s.addReferral);

  const create = (data: CreateClientDTO) => {
    // 1️⃣ Crear cliente
    const newClient = createClient(data);

    // 2️⃣ Si hay código de referido
    if (data.usedReferralCode) {
      const referrer = customers.find(
        (c) => c.referralCode === data.usedReferralCode,
      );

      if (referrer) {
        addReferral({
          id: "REF-" + crypto.randomUUID(),
          tenantId: useTenantStore.getState().activeTenant.id,
          referrerClientId: referrer.id,
          referredClientId: newClient.id,
          status: "pending",
          createdAt: new Date(),
          rewardedAt: null,
        });

        // opcional: marcar en el cliente
        newClient.referredByClientId = referrer.id;
      }
    }

    return newClient;
  };

  return { create };
}
