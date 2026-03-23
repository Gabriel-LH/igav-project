import { Client } from "../../../types/clients/type.client";

export interface ClientRepository {
  addClient(client: Client): Promise<void>;
  getClientById(id: string): Promise<Client | undefined>;
  getClientByReferralCode(code: string): Promise<Client | undefined>;
  getAllClients(): Promise<Client[]>;
}
