import { ClientRepository } from "../../../domain/tenant/repositories/ClientRepository";
import { useCustomerStore } from "../../../store/useCustomerStore";
import { Client } from "../../../types/clients/type.client";

export class ZustandClientRepository implements ClientRepository {
  async addClient(client: Client): Promise<void> {
    useCustomerStore.getState().addCustomer(client);
  }

  async getClientById(id: string): Promise<Client | undefined> {
    return useCustomerStore.getState().getCustomerById(id);
  }

  async getClientByReferralCode(code: string): Promise<Client | undefined> {
    return useCustomerStore
      .getState()
      .customers.find((c) => c.referralCode === code);
  }

  async getAllClients(): Promise<Client[]> {
    return useCustomerStore.getState().customers;
  }
}
