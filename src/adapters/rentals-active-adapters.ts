import { BRANCH_MOCKS } from "../mocks/mock.branch";
import { USER_MOCK } from "../mocks/mock.user";
import { useAttributeStore } from "../store/useAttributeStore";
import { Client } from "../types/clients/type.client";
import { Guarantee } from "../types/guarantee/type.guarantee";
import { Product } from "../types/product/type.product";
import { Rental } from "../types/rentals/type.rentals";
import { RentalItem } from "../types/rentals/type.rentalsItem";

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
  searchContent: string;
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

    const currentItems = rentalItems.filter((r) => r.rentalId === rental.id);

    const { colors, sizes } = useAttributeStore();
    // Enriquecer items
    const itemsWithNames = currentItems.map((item) => {
      const prod = products.find((p) => p.id === item.productId);
      return {
        ...item,
        productName: prod?.name || "Desconocido",
        // Agregamos info visual útil para el Drawer
        image: prod?.image,
        sku: prod?.sku,
      };
    });

    const mainProductName = itemsWithNames[0]?.productName || "Sin productos";
    const distinctCount = itemsWithNames.length;

    const cleanSummary =
      distinctCount > 1
        ? `${mainProductName} (+${distinctCount - 1} más)`
        : mainProductName;

    const totalItems = currentItems.reduce(
      (acc, item) => acc + (item.quantity || 1),
      0,
    );

    const size = sizes.find((s) => s.id === currentItems[0].sizeId);
    const color = colors.find((c) => c.id === currentItems[0].colorId);
    // CONTENIDO DE BÚSQUEDA
    const searchContent = [
      rental.id,
      customer?.firstName,
      customer?.lastName,
      customer?.dni,
      ...itemsWithNames.map((i) => i.productName),
      size?.name,
      color?.name,
      ...currentItems.map((i) => i.stockId),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

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
      summary: cleanSummary,
      totalItems,
      itemsDetail: itemsWithNames,

      // Campos legacy adaptados
      product: cleanSummary, // <--- COMPATIBILIDAD: La tabla mostrará el resumen en la columna "Producto"
      count: totalItems, // <--- COMPATIBILIDAD
      rent_unit: (() => {
        const units = Array.from(
          new Set(
            currentItems
              .map(
                (item) =>
                  products.find((p) => p.id === item.productId)?.rent_unit,
              )
              .filter(Boolean),
          ),
        );
        if (units.length > 1) return "Mixto";
        if (units.length === 1) return units[0] === "día" ? "Días" : "Evento";
        return "---";
      })(),
      income:
        currentItems.reduce(
          (acc, item) => acc + item.priceAtMoment, // Basado en el feedback del usuario de que se multiplicaba de más
          0,
        ) || 0,
      gurantee_type: guarantee ? guarantee.type.toString() : "---",
      gurantee_value: guarantee ? guarantee.value.toString() : "---",
      guarantee_status: guarantee?.status || "---",
      status: rental.status,
      damage: "---", // Difícil de resumir si hay muchos
      searchContent,
    };
  });
};
