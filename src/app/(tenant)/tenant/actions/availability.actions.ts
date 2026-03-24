"use server";

import prisma from "@/src/lib/prisma";
import { requireTenantMembership } from "@/src/infrastructure/tenant/auth.guard";
import { PrismaReservationRepository } from "@/src/infrastructure/tenant/repositories/PrismaReservationRepository";
import { PrismaRentalRepository } from "@/src/infrastructure/tenant/repositories/PrismaRentalRepository";
import { PrismaOperationRepository } from "@/src/infrastructure/tenant/repositories/PrismaOperationRepository";
import { PrismaPaymentRepository } from "@/src/infrastructure/tenant/repositories/PrismaPaymentRepository";
import { Reservation } from "@/src/types/reservation/type.reservation";
import { Rental } from "@/src/types/rentals/type.rentals";
import { ReservationItem } from "@/src/types/reservation/type.reservationItem";
import { RentalItem } from "@/src/types/rentals/type.rentalsItem";

export async function getAvailabilityCalendarDataAction() {
  try {
    const membership = await requireTenantMembership();
    const { tenantId } = membership;

    if (!tenantId) {
      throw new Error("Tenant ID es obligatorio");
    }

    const reservationRepo = new PrismaReservationRepository(prisma);
    const rentalRepo = new PrismaRentalRepository(prisma);
    const operationRepo = new PrismaOperationRepository(prisma);
    const paymentRepo = new PrismaPaymentRepository(prisma);

    const [reservations, reservationItems, rentals, rentalItems, operations, payments] =
      await Promise.all([
        reservationRepo.getReservations(),
        reservationRepo.getReservationItems(),
        rentalRepo.getRentals(),
        rentalRepo.getRentalItems(),
        operationRepo.getOperationsByTenant(tenantId),
        paymentRepo.getPaymentsByTenant(tenantId),
      ]);

    const tenantReservations = reservations.filter(
      (reservation: Reservation) => reservation.tenantId === tenantId,
    );
    const tenantReservationIds = new Set(
      tenantReservations.map((reservation: Reservation) => reservation.id),
    );
    const tenantRentals = rentals.filter((rental: Rental) => rental.tenantId === tenantId);
    const tenantRentalIds = new Set(tenantRentals.map((rental: Rental) => rental.id));

    return {
      success: true,
      data: {
        reservations: tenantReservations,
        reservationItems: reservationItems.filter((item: ReservationItem) =>
          tenantReservationIds.has(item.reservationId),
        ),
        rentals: tenantRentals,
        rentalItems: rentalItems.filter((item: RentalItem) =>
          tenantRentalIds.has(item.rentalId),
        ),
        operations,
        payments,
      },
    };
  } catch (error) {
    console.error("Error al obtener disponibilidad:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "No se pudo obtener la disponibilidad",
    };
  }
}
