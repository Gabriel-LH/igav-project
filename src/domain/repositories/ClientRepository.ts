import { Client } from "../../types/clients/type.client";

export interface ClientRepository {
  addClient(client: Client): void;
  getClientById(id: string): Client | undefined;
  getClientByReferralCode(code: string): Client | undefined;
  getAllClients(): Client[];
}
