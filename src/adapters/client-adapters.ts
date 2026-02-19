import { BRANCH_MOCKS } from "../mocks/mock.branch";
import { USER_MOCK } from "../mocks/mock.user";
import { Client } from "../types/clients/type.client";
import { Guarantee } from "../types/guarantee/type.guarantee";
import { Product } from "../types/product/type.product";
import { Rental } from "../types/rentals/type.rentals";
import { RentalItem } from "../types/rentals/type.rentalsItem";
import { generateProductsSummary } from "../utils/generateProductsSummary";

// Este es el tipo que tu tabla espera (el que definiste en Zod)
export interface ClientTableRow {
  id: string;
  userName: string;
  firstName: string;
  lastName: string;
  dni: string;
  email?: string;
  phone: string;
  address: string;
  city: string;
  province?: string;
  zipCode?: string;

  // Dinero real a favor del cliente (por devoluciones o vueltos)
  walletBalance: number;

  // Puntos acumulados por compras (gamificación)
  loyaltyPoints: number;

  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  status: "active" | "inactive";
}

export const mapClientToTable = (customers: Client[]): ClientTableRow[] => {
  return customers.map((customer) => {
    const searchContent = [
      customer.id,
      customer.firstName,
      customer.lastName,
      customer.dni,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return {
      id: customer.id,
      userName: `${customer.firstName} ${customer.lastName}`,
      firstName: customer.firstName,
      lastName: customer.lastName,
      dni: customer.dni,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      province: customer.province,
      zipCode: customer.zipCode,
      walletBalance: customer.walletBalance,
      loyaltyPoints: customer.loyaltyPoints,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      deletedAt: customer.deletedAt,
      status: customer.status,
      searchContent,
    };
  });
};
