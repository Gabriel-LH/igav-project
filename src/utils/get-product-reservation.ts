// utils/get-product-reservation.ts
import { RESERVATIONS_MOCK } from "../mocks/mock.reservation";

export const getReservationByProductId = (productId: number) => {
  return RESERVATIONS_MOCK.find(res => res.productId === productId);
};