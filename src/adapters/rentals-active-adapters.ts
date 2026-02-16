import { BRANCH_MOCKS } from "../mocks/mock.branch";
import { USER_MOCK } from "../mocks/mock.user";
import { Client } from "../types/clients/type.client";
import { Guarantee } from "../types/guarantee/type.guarantee";
import { Product } from "../types/product/type.product";
import { Rental } from "../types/rentals/type.rentals";
import { RentalItem } from "../types/rentals/type.rentalsItem";
import { generateProductsSummary } from "../utils/generateProductsSummary";

// Este es el tipo que tu tabla espera (el que definiste en Zod)
export interface RentalTableRow {
  id: string;
  branchName: string;
  sellerName: string;
  outDate: string;
  expectedReturnDate: string;
  cancelDate: string;
  nameCustomer: string;

  // Nuevos campos de agrupación
  summary: string;
  totalItems: number;
  itemsDetail: RentalItem[];

  // Campos antiguos mantenidos por compatibilidad o migración
  product: string; // Mapeado a summary para que no rompa la tabla actual
  count: number; // Mapeado a totalItems
  rent_unit: string;
  income: number; // Total de la operación
  gurantee_type: string;
  gurantee_value: string;
  guarantee_status: string;
  status: string;
  damage: string;
  returnDate: string;
}

export const mapRentalToTable = (
  customers: Client[],
  rentals: Rental[],
  guarantees: Guarantee[],
  rentalItems: RentalItem[],
  products: Product[],
): RentalTableRow[] => {
  return rentals.map((rental) => {
    const branch = BRANCH_MOCKS.find((b) => b.id === rental.branchId);
    const customer = customers.find((c) => c.id === rental.customerId);
    const guarantee = guarantees.find((g) => g.id === rental.guaranteeId);
    const seller = USER_MOCK[0]; // TODO: Buscar seller real si está disponible

    // 1. Buscamos TODOS los items de esta operación
    const currentItems = rentalItems.filter((r) => r.rentalId === rental.id);

    // 2. Enriquecemos los items con el nombre del producto para el resumen
    const itemsWithNames = currentItems.map((item) => {
      const prod = products.find((p) => p.id === item.productId);
      return { ...item, productName: prod?.name };
    });

    // 3. Generamos resumen y conteo
    const summary = generateProductsSummary(itemsWithNames);
    const totalItems = currentItems.reduce(
      (acc, item) => acc + item.quantity,
      0,
    );

    return {
      id: rental.id,
      branchName: branch?.name || "Principal",
      sellerName: seller?.name || "",
      outDate: rental.outDate
        ? new Date(rental.outDate).toLocaleDateString()
        : "---",
      expectedReturnDate: rental.expectedReturnDate
        ? new Date(rental.expectedReturnDate).toLocaleDateString()
        : "---",
      cancelDate: rental.cancelDate
        ? new Date(rental.cancelDate).toLocaleDateString()
        : "---",
      returnDate: rental.actualReturnDate
        ? new Date(rental.actualReturnDate).toLocaleDateString()
        : "---",
      nameCustomer: customer?.firstName + " " + customer?.lastName || "---",

      // Nuevos campos
      summary,
      totalItems,
      itemsDetail: currentItems,

      // Campos legacy adaptados
      product: summary, // <--- COMPATIBILIDAD: La tabla mostrará el resumen en la columna "Producto"
      count: totalItems, // <--- COMPATIBILIDAD
      rent_unit:
        currentItems.length === 1
          ? products.find((p) => p.id === currentItems[0].productId)
              ?.rent_unit || "---"
          : "Varios",
      income:
        currentItems.reduce(
          (acc, item) => acc + item.priceAtMoment * (item.quantity || 1),
          0,
        ) || 0,
      gurantee_type: guarantee ? guarantee.type.toString() : "---",
      gurantee_value: guarantee ? guarantee.value.toString() : "---",
      guarantee_status: guarantee?.status || "---",
      status: rental.status,
      damage: "---", // Difícil de resumir si hay muchos
    };
  });
};
