// src/utils/reservation-helpers.ts
import { Reservation } from "../types/reservation/type.reservation";

/**
 * Verifica si hay al menos una reserva activa en un listado de reservas.
 * Se considera activa si su estado es "pendiente" o "confirmada".
 */
export const hasActiveReservation = (reservations: Reservation[] | undefined): boolean => {
  if (!reservations || reservations.length === 0) return false;
  
  const activeStatuses = ["pendiente", "confirmada"];
  
  // .some devuelve true si encuentra al menos un elemento que cumpla la condición
  return reservations.some((res) => activeStatuses.includes(res.status));
};

/**
 * Helper adicional: Obtener la reserva activa actual (si existe)
 * Útil para mostrar los detalles en la Card (talla, color, etc.)
 */
export const getActiveReservation = (reservations: Reservation[] | undefined): Reservation | undefined => {
  if (!reservations) return undefined;
  const activeStatuses = ["pendiente", "confirmada"];
  return reservations.find((res) => activeStatuses.includes(res.status));
};