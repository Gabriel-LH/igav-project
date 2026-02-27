import { ClientRepository } from "../../domain/repositories/ClientRepository";
import { ReferralRepository } from "../../domain/repositories/ReferralRepository";
import { Client } from "../../types/clients/type.client";
import { generateUniqueReferralCode } from "../../utils/referral/generateReferralCode";

export interface CreateClientDTO {
  dni: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  usedReferralCode?: string;
  tenantId: string;
}

export class CreateClientUseCase {
  constructor(
    private clientRepo: ClientRepository,
    private referralRepo: ReferralRepository,
  ) {}

  execute(data: CreateClientDTO): Client {
    const clients = this.clientRepo.getAllClients();
    const existingCodes = new Set(clients.map((c) => c.referralCode));

    // Generar código único
    const referralCode = generateUniqueReferralCode(existingCodes);

    let referredByClientId = null;

    if (data.usedReferralCode) {
      const referrer = this.clientRepo.getClientByReferralCode(
        data.usedReferralCode,
      );
      if (referrer) {
        referredByClientId = referrer.id;
      }
    }

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
      referredByClientId: referredByClientId,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      deleteReason: null,
    };

    this.clientRepo.addClient(newClient);

    if (referredByClientId) {
      this.referralRepo.addReferral({
        id: "REF-" + crypto.randomUUID(),
        tenantId: data.tenantId,
        referrerClientId: referredByClientId,
        referredClientId: newClient.id,
        status: "pending",
        createdAt: new Date(),
        rewardedAt: null,
      });
    }

    return newClient;
  }
}
