import { useCustomerStore } from "@/src/store/useCustomerStore";
import { Client } from "@/src/types/clients/type.client"; 

interface CreateClientDTO {
  dni: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
}

export function useCreateClient() {
  const addCustomer = useCustomerStore((s) => s.addCustomer);

  const createClient = (data: CreateClientDTO) => {
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
    };

    addCustomer(newClient);

    return newClient;
  };

  return { createClient };
}
