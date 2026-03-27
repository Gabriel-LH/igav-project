"use server";

import prisma from "@/src/lib/prisma";
import { requireTenantMembership } from "@/src/infrastructure/tenant/auth.guard";

interface OpenCashSessionInput {
  branchId: string;
  openingAmount: number;
  notes?: string;
}

interface CloseCashSessionInput {
  sessionId: string;
  countedAmount: number;
}

const buildSessionNumber = (openedAt: Date, totalSessions: number) => {
  const year = openedAt.getFullYear();
  const month = String(openedAt.getMonth() + 1).padStart(2, "0");
  const day = String(openedAt.getDate()).padStart(2, "0");
  const sequence = String(totalSessions + 1).padStart(4, "0");

  return `SES-${year}${month}${day}-${sequence}`;
};

export async function getCashDashboardDataAction() {
  const { tenantId } = await requireTenantMembership();

  if (!tenantId) {
    return { success: false as const, error: "Tenant no encontrado" };
  }

  const [sessions, payments, memberships, operations, clients, paymentMethods] = await Promise.all([
    prisma.cashSession.findMany({
      where: { tenantId },
      orderBy: { openedAt: "desc" },
    }),
    prisma.payment.findMany({
      where: { tenantId },
      orderBy: { date: "desc" },
    }),
    prisma.userTenantMembership.findMany({
      where: { tenantId, status: "active" },
      include: {
        user: true,
        role: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.operation.findMany({
      where: { tenantId },
      orderBy: { date: "desc" },
    }),
    prisma.client.findMany({
      where: {
        tenantId,
        isDeleted: false,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.paymentMethod.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  const users = memberships.map(({ user, defaultBranchId, role }) => ({
    id: user.id,
    userName: user.name,
    firstName: user.name.split(" ")[0] || "",
    lastName: user.name.split(" ").slice(1).join(" ") || "",
    email: user.email,
    phone: undefined,
    status: user.status,
    role: role?.name,
    image: user.image || undefined,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    branchId: defaultBranchId,
  }));

  return {
    success: true as const,
    data: {
      sessions,
      payments,
      users,
      operations: operations.map((operation) => ({
        ...operation,
        customerMode: operation.customerId ? "registered" : "general",
        customerId: operation.customerId || "",
      })),
      clients: clients.map((client) => ({
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
      })),
      paymentMethods: paymentMethods.map((method) => ({
        id: method.id,
        name: method.name,
        type: method.type,
        active: method.active,
        allowsChange: method.allowsChange,
        requiresPin: method.requiresPin,
        icon: method.icon || undefined,
      })),
    },
  };
}

export async function openCashSessionAction(input: OpenCashSessionInput) {
  const { tenantId, user } = await requireTenantMembership();

  if (!tenantId) {
    return { success: false as const, error: "Tenant no encontrado" };
  }

  const existingOpenSession = await prisma.cashSession.findFirst({
    where: {
      tenantId,
      branchId: input.branchId,
      status: "open",
    },
  });

  if (existingOpenSession) {
    return {
      success: false as const,
      error: "Ya existe una sesión de caja abierta en esta sucursal",
    };
  }

  const openedAt = new Date();
  const totalSessions = await prisma.cashSession.count({
    where: { tenantId },
  });

  const session = await prisma.cashSession.create({
    data: {
      tenantId,
      branchId: input.branchId,
      openedById: user.id,
      openedAt,
      sessionNumber: buildSessionNumber(openedAt, totalSessions),
      status: "open",
      openingAmount: input.openingAmount,
      notes: input.notes || null,
    },
  });

  return {
    success: true as const,
    data: session,
  };
}

export async function closeCashSessionAction(input: CloseCashSessionInput) {
  const { tenantId, user } = await requireTenantMembership();

  if (!tenantId) {
    return { success: false as const, error: "Tenant no encontrado" };
  }

  const session = await prisma.cashSession.findFirst({
    where: {
      id: input.sessionId,
      tenantId,
    },
    include: {
      payments: {
        include: {
          paymentMethod: {
            select: {
              type: true,
            },
          },
        },
      },
    },
  });

  if (!session) {
    return { success: false as const, error: "Sesión no encontrada" };
  }

  if (session.status === "closed") {
    return { success: false as const, error: "La sesión ya está cerrada" };
  }

  const cashBalance = session.payments.reduce((total, payment) => {
    if (payment.paymentMethod.type !== "cash" || payment.status !== "posted") {
      return total;
    }

    return payment.direction === "in"
      ? total + payment.amount
      : total - payment.amount;
  }, 0);

  const expectedAmount = session.openingAmount + cashBalance;
  const difference = input.countedAmount - expectedAmount;

  const updatedSession = await prisma.cashSession.update({
    where: { id: session.id },
    data: {
      closedById: user.id,
      closedAt: new Date(),
      status: "closed",
      closingExpectedAmount: expectedAmount,
      closingCountedAmount: input.countedAmount,
      closingDifference: difference,
    },
  });

  return {
    success: true as const,
    data: updatedSession,
  };
}
