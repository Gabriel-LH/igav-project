import { useCustomerStore } from "@/src/store/useCustomerStore";
import { Client } from "@/src/types/clients/type.client";
import { generateUniqueReferralCode } from "@/src/utils/referral/generateReferralCode";

export interface CreateClientDTO {
  dni: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  usedReferralCode?: string;
}

export function useCreateClient() {
  const addCustomer = useCustomerStore((s) => s.addCustomer);

  const customers = useCustomerStore((s) => s.customers);

  const createClient = (data: CreateClientDTO) => {
    const existingCodes = new Set(customers.map((c) => c.referralCode));

    // 2️⃣ Generar código único
    const referralCode = generateUniqueReferralCode(existingCodes);

    const newClient: Client = {
      id: "CLi-" + crypto.randomUUID(),
      userName: undefined,
      firstName: data.firstName,
      lastName: data.lastName,
      dni: data.dni,
      phone: data.phone,
      email: data.email,
      address: data.address,
      city: data.city,
      province: undefined,
      zipCode: undefined,
      walletBalance: 0,
      loyaltyPoints: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "active",
      type: "individual",
      referralCode: referralCode,
      referredByClientId: null,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      deleteReason: null,
    };

    addCustomer(newClient);

    return newClient;
  };

  return { createClient };
}
