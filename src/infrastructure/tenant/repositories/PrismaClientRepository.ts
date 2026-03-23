import {
  Client as PrismaClientRecord,
  Prisma,
  PrismaClient,
} from "@/prisma/generated/client";
import { ClientRepository } from "@/src/domain/tenant/repositories/ClientRepository";
import { Client } from "@/src/types/clients/type.client";

const mapPrismaClient = (client: PrismaClientRecord): Client => ({
  id: client.id,
  userName: client.userName || undefined,
  firstName: client.firstName,
  lastName: client.lastName,
  dni: client.dni,
  email: client.email || undefined,
  phone: client.phone,
  address: client.address,
  city: client.city,
  province: client.province || undefined,
  zipCode: client.zipCode || undefined,
  type: client.type,
  walletBalance: client.walletBalance ?? 0,
  loyaltyPoints: client.loyaltyPoints ?? 0,
  referralCode: client.referralCode,
  referredByClientId: client.referredByClientId ?? null,
  createdAt: client.createdAt,
  updatedAt: client.updatedAt,
  createdBy: client.createdBy || undefined,
  updatedBy: client.updatedBy || undefined,
  isDeleted: client.isDeleted,
  deletedAt: client.deletedAt ?? null,
  deletedBy: client.deletedBy ?? null,
  deleteReason: client.deleteReason ?? null,
  status: client.status,
  internalNotes: client.internalNotes || undefined,
  metadata: (client.metadata as Record<string, unknown> | null) || undefined,
});

export class PrismaClientRepository implements ClientRepository {
  constructor(
    private readonly prisma: PrismaClient | Prisma.TransactionClient,
    private readonly tenantId?: string,
  ) {}

  async addClient(client: Client): Promise<void> {
    if (!this.tenantId) {
      throw new Error("Tenant ID es obligatorio para crear clientes");
    }

    await this.prisma.client.create({
      data: {
        id: client.id,
        tenantId: this.tenantId,
        userName: client.userName,
        firstName: client.firstName,
        lastName: client.lastName,
        dni: client.dni,
        email: client.email,
        phone: client.phone,
        address: client.address,
        city: client.city,
        province: client.province,
        zipCode: client.zipCode,
        type: client.type,
        walletBalance: client.walletBalance,
        loyaltyPoints: client.loyaltyPoints,
        referralCode: client.referralCode,
        referredByClientId: client.referredByClientId,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt,
        createdBy: client.createdBy,
        updatedBy: client.updatedBy,
        isDeleted: client.isDeleted,
        deletedAt: client.deletedAt,
        deletedBy: client.deletedBy,
        deleteReason: client.deleteReason,
        status: client.status,
        internalNotes: client.internalNotes,
        metadata: client.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async getClientById(id: string): Promise<Client | undefined> {
    const client = await this.prisma.client.findFirst({
      where: {
        id,
        tenantId: this.tenantId,
        isDeleted: false,
      },
    });

    return client ? mapPrismaClient(client) : undefined;
  }

  async getClientByReferralCode(code: string): Promise<Client | undefined> {
    const client = await this.prisma.client.findFirst({
      where: {
        referralCode: code,
        tenantId: this.tenantId,
        isDeleted: false,
      },
    });

    return client ? mapPrismaClient(client) : undefined;
  }

  async getAllClients(): Promise<Client[]> {
    const clients = await this.prisma.client.findMany({
      where: {
        tenantId: this.tenantId,
        isDeleted: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return clients.map(mapPrismaClient);
  }
}
