import {
  Reservation,
  ReservationWithItems,
} from "@/src/types/reservation/type.reservation";
import { ReservationItem } from "@/src/types/reservation/type.reservationItem";
import { PrismaClient, Prisma } from "@/prisma/generated/client";

export class PrismaReservationRepository implements ReservationRepository {
  constructor(
    private readonly prisma: PrismaClient | Prisma.TransactionClient,
  ) {}

  async addReservation(
    reservation: Reservation,
    reservationItems: ReservationItem[],
  ): Promise<void> {
    await this.prisma.reservation.create({
      data: {
        id: reservation.id,
        tenantId: reservation.tenantId,
        operationId: reservation.operationId,
        branchId: reservation.branchId,
        customerId: reservation.customerId,
        operationType: reservation.operationType as any,
        startDate: reservation.startDate,
        endDate: reservation.endDate,
        hour: reservation.hour,
        status: reservation.status as any,
        notes: reservation.notes || "",
        createdAt: reservation.createdAt,
        updatedAt: reservation.updatedAt,
        items: {
          create: reservationItems.map((item) => ({
            id: item.id,
            tenantId: item.tenantId || reservation.tenantId,
            operationId: item.operationId,
            productId: item.productId,
            variantId: item.variantId,
            stockId: item.stockId || null,
            quantity: item.quantity || 1,
            priceAtMoment: item.priceAtMoment,
            listPrice: item.listPrice ?? null,
            discountAmount: item.discountAmount ?? 0,
            discountReason: item.discountReason ?? null,
            promotionId: item.promotionId ?? null,
            bundleId: item.bundleId ?? null,
            itemStatus: item.itemStatus as any,
            notes: item.notes || "",
            isSerial: item.isSerial ?? false,
            inventoryItemId: item.inventoryItemId || null,
          })),
        },
      },
    });

    await this.addReservationStatusHistory({
      tenantId: reservation.tenantId,
      reservationId: reservation.id,
      fromStatus: reservation.status,
      toStatus: reservation.status,
      reason: "CREATED",
      createdAt: reservation.createdAt,
    });

    if (reservationItems.length > 0) {
      await this.addReservationItemStatusHistory(
        reservationItems.map((item) => ({
          tenantId: item.tenantId || reservation.tenantId,
          reservationItemId: item.id,
          fromStatus: item.itemStatus,
          toStatus: item.itemStatus,
          reason: "CREATED",
          createdAt: item.createdAt || reservation.createdAt,
        })),
      );
    }
  }

  async getReservations(): Promise<Reservation[]> {
    const reservations = await this.prisma.reservation.findMany();
    return reservations as unknown as Reservation[];
  }

  async updateStatus(
    id: string,
    newStatus: string,
    itemStatus: string,
  ): Promise<void> {
    await this.prisma.reservation.update({
      where: { id },
      data: {
        status: newStatus as any,
        items: {
          updateMany: {
            where: { reservationId: id },
            data: { itemStatus: itemStatus as any },
          },
        },
      },
    });
  }

  async updateReservationItemStatus(
    itemId: string,
    status: string,
  ): Promise<void> {
    await this.prisma.reservationItem.update({
      where: { id: itemId },
      data: { itemStatus: status as any },
    });
  }

  async getReservationItems(): Promise<ReservationItem[]> {
    const items = await this.prisma.reservationItem.findMany();
    return items as unknown as ReservationItem[];
  }

  async getReservationById(id: string): Promise<Reservation | undefined> {
    const res = await this.prisma.reservation.findUnique({ where: { id } });
    if (!res) return undefined;
    return res as unknown as Reservation;
  }

  async getReservationWithItemsById(
    id: string,
  ): Promise<ReservationWithItems | undefined> {
    const res = await this.prisma.reservation.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!res) return undefined;
    return res as unknown as ReservationWithItems;
  }

  async getExpiredReservations(
    tenantId: string,
    hoursThreshold: number,
  ): Promise<ReservationWithItems[]> {
    const thresholdDate = new Date();
    thresholdDate.setHours(thresholdDate.getHours() - hoursThreshold);

    const expired = await this.prisma.reservation.findMany({
      where: {
        tenantId,
        status: "confirmada",
        createdAt: {
          lte: thresholdDate,
        },
      },
      include: { items: true },
    });
    return expired as unknown as ReservationWithItems[];
  }

  async cancelReservation(id: string): Promise<void> {
    await this.updateStatus(id, "cancelada", "cancelada");
  }

  private async addReservationStatusHistory(entry: {
    tenantId: string;
    reservationId: string;
    fromStatus: string;
    toStatus: string;
    reason?: string;
    changedBy?: string;
    createdAt?: Date;
  }): Promise<void> {
    await this.prisma.reservationStatusHistory.create({
      data: {
        id: crypto.randomUUID(),
        tenantId: entry.tenantId,
        reservationId: entry.reservationId,
        fromStatus: entry.fromStatus,
        toStatus: entry.toStatus,
        reason: entry.reason ?? null,
        changedBy: entry.changedBy ?? null,
        createdAt: entry.createdAt ?? new Date(),
      },
    });
  }

  private async addReservationItemStatusHistory(entries: Array<{
    tenantId: string;
    reservationItemId: string;
    fromStatus: string;
    toStatus: string;
    reason?: string;
    changedBy?: string;
    createdAt?: Date;
  }>): Promise<void> {
    if (!entries.length) return;

    await (this.prisma as any).reservationItemStatusHistory.createMany({
      data: entries.map((entry) => ({
        id: crypto.randomUUID(),
        tenantId: entry.tenantId,
        reservationItemId: entry.reservationItemId,
        fromStatus: entry.fromStatus,
        toStatus: entry.toStatus,
        reason: entry.reason ?? null,
        changedBy: entry.changedBy ?? null,
        createdAt: entry.createdAt ?? new Date(),
      })),
    });
  }
}
