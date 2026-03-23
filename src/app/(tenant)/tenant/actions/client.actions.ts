"use server";

import prisma from "@/src/lib/prisma";
import { requireTenantMembership } from "@/src/infrastructure/tenant/auth.guard";
import { PrismaClientRepository } from "@/src/infrastructure/tenant/repositories/PrismaClientRepository";
import { PrismaReferralRepository } from "@/src/infrastructure/tenant/repositories/PrismaReferralRepository";
import {
  CreateClientDTO,
  CreateClientUseCase,
} from "@/src/application/tenant/use-cases/client/createClient.usecase";
import { revalidatePath } from "next/cache";

export async function getClientsAction() {
  try {
    const membership = await requireTenantMembership();
    const { tenantId } = membership;

    if (!tenantId) {
      throw new Error("Tenant ID es obligatorio");
    }

    const clientRepo = new PrismaClientRepository(prisma, tenantId);
    const clients = await clientRepo.getAllClients();

    return { success: true, data: clients };
  } catch (error) {
    console.error("Error al obtener clientes:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "No se pudieron obtener los clientes",
    };
  }
}

export async function createClientAction(
  payload: Omit<CreateClientDTO, "tenantId">,
) {
  try {
    const membership = await requireTenantMembership();
    const { tenantId, user } = membership;

    if (!tenantId) {
      throw new Error("Tenant ID es obligatorio");
    }

    const clientRepo = new PrismaClientRepository(prisma, tenantId);
    const referralRepo = new PrismaReferralRepository(prisma);
    const createClientUseCase = new CreateClientUseCase(clientRepo, referralRepo);

    const client = await createClientUseCase.execute({
      ...payload,
      tenantId,
      actorUserId: user.id,
    });

    revalidatePath("/tenant/client", "page");
    revalidatePath("/tenant/home", "page");

    return { success: true, data: client };
  } catch (error) {
    console.error("Error al crear cliente:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "No se pudo crear el cliente",
    };
  }
}
