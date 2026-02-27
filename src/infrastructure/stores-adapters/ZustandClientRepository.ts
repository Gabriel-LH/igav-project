import { ClientRepository } from "../../domain/repositories/ClientRepository";
import { useCustomerStore } from "../../store/useCustomerStore";
import { Client } from "../../types/clients/type.client";

export class ZustandClientRepository implements ClientRepository {
  addClient(client: Client): void {
    useCustomerStore.getState().addCustomer(client);
  }

  getClientById(id: string): Client | undefined {
    return useCustomerStore.getState().getCustomerById(id);
  }

  getClientByReferralCode(code: string): Client | undefined {
    return useCustomerStore
      .getState()
      .customers.find((c) => c.referralCode === code);
  }

  getAllClients(): Client[] {
    return useCustomerStore.getState().customers;
  }
}
